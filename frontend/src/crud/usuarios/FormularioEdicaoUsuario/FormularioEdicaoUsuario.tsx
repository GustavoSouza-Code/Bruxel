import { useState } from "react";
import type { FormEvent } from "react";
import { mensagemDeErro } from "../../../api/cliente";
import type { CamposAtualizacaoUsuario } from "../../../api/usuarios";
import type { Usuario } from "../../../tipos/usuario";
import { CAMPOS_ENDERECO, paraCamposAtualizacao, validarEndereco } from "../camposUsuario";
import type { CampoEditavelUsuario } from "../camposUsuario";
import "./FormularioEdicaoUsuario.css";

interface FormularioEdicaoUsuarioProps {
  usuario: Usuario;
  /** o próprio admin não pode mudar o perfil dele (o backend também recusa) */
  podeAlterarPerfil: boolean;
  /** salva os campos e o perfil escolhido; se rejeitar, a mensagem aparece no formulário */
  onSalvar: (campos: CamposAtualizacaoUsuario, perfil: Usuario["perfil"]) => Promise<void>;
  onCancelar: () => void;
}

/**
 * Formulário de edição de usuário do painel admin (aberto num modal). Edita
 * uma cópia do usuário e só manda pra API ao salvar. Se a API recusar (ex.:
 * e-mail que já existe), mostra a mensagem e mantém o que foi digitado.
 */
export function FormularioEdicaoUsuario({
  usuario,
  podeAlterarPerfil,
  onSalvar,
  onCancelar,
}: FormularioEdicaoUsuarioProps) {
  // cópia editável; a função inicial só roda quando o formulário é criado
  const [rascunho, setRascunho] = useState<Usuario>(() => ({ ...usuario }));
  const [erro, setErro] = useState<string | null>(null);
  // true enquanto salva (desabilita os botões)
  const [salvando, setSalvando] = useState(false);

  function atualizarCampo(campo: CampoEditavelUsuario, valor: string) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
  }

  // confirmação só quando o perfil muda; cancelar mantém o modal aberto sem salvar
  function confirmarTrocaPerfil() {
    if (rascunho.perfil === usuario.perfil) return true;

    return window.confirm(
      rascunho.perfil === "ADMINISTRADOR"
        ? `Dar acesso de administrador a ${usuario.nome}? A mudança vale no próximo login.`
        : `Remover o acesso de administrador de ${usuario.nome}?`
    );
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    // o backend não valida o update: sem isso daria pra salvar um usuário sem nome
    if (!rascunho.nome.trim() || !rascunho.email.trim()) {
      setErro("Nome e e-mail são obrigatórios.");
      return;
    }
    const erroEndereco = validarEndereco(rascunho);
    if (erroEndereco) {
      setErro(erroEndereco);
      return;
    }
    if (!confirmarTrocaPerfil()) {
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar(paraCamposAtualizacao(rascunho), rascunho.perfil);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setSalvando(false);
    }
  }

  return (
    <form className="formulario-edicao-usuario" onSubmit={enviar}>
      <label className="formulario-edicao-usuario__inteiro">
        Nome
        <input
          value={rascunho.nome}
          onChange={(e) => atualizarCampo("nome", e.target.value)}
          maxLength={150}
          required
        />
      </label>
      <label>
        E-mail
        <input
          type="email"
          value={rascunho.email}
          onChange={(e) => atualizarCampo("email", e.target.value)}
          maxLength={255}
          required
        />
      </label>
      <label>
        Telefone
        <input
          type="tel"
          value={rascunho.telefone ?? ""}
          onChange={(e) => atualizarCampo("telefone", e.target.value)}
          maxLength={20}
        />
      </label>
      {/* o backend não deixa trocar o CPF, então ele só aparece */}
      <label>
        CPF
        <input value={rascunho.cpf} readOnly disabled />
      </label>

      <label className="formulario-edicao-usuario__inteiro">
        Perfil
        <select
          value={rascunho.perfil}
          onChange={(e) =>
            setRascunho((atual) => ({ ...atual, perfil: e.target.value as Usuario["perfil"] }))
          }
          disabled={!podeAlterarPerfil}
          title={podeAlterarPerfil ? undefined : "Você não pode alterar o próprio perfil"}
        >
          <option value="CLIENTE">Cliente</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </select>
        {!podeAlterarPerfil && (
          <span className="formulario-edicao-usuario__ajuda">
            Você não pode alterar o próprio perfil.
          </span>
        )}
        {podeAlterarPerfil && rascunho.perfil === "ADMINISTRADOR" && (
          <span className="formulario-edicao-usuario__ajuda">
            Tem acesso total ao painel de gestão.
          </span>
        )}
      </label>

      <fieldset className="formulario-edicao-usuario__inteiro formulario-edicao-usuario__endereco">
        <legend>Endereço</legend>
        {CAMPOS_ENDERECO.map(({ campo, label, maxLength, normalizar }) => (
          <label key={campo}>
            {label}
            <input
              value={rascunho[campo] ?? ""}
              onChange={(e) =>
                atualizarCampo(campo, normalizar ? normalizar(e.target.value) : e.target.value)
              }
              maxLength={maxLength}
            />
          </label>
        ))}
      </fieldset>

      {erro && (
        <p className="formulario-edicao-usuario__erro formulario-edicao-usuario__inteiro" role="alert">
          {erro}
        </p>
      )}

      <div className="formulario-edicao-usuario__acoes formulario-edicao-usuario__inteiro">
        <button type="submit" className="formulario-edicao-usuario__salvar" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </button>
        <button
          type="button"
          className="formulario-edicao-usuario__cancelar"
          onClick={onCancelar}
          disabled={salvando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default FormularioEdicaoUsuario;
