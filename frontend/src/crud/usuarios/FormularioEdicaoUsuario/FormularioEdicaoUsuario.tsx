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
  /** salva os campos; se a promessa rejeitar, a mensagem do erro aparece no formulário */
  onSalvar: (campos: CamposAtualizacaoUsuario) => Promise<void>;
  onCancelar: () => void;
}

/**
 * Formulário de edição de usuário do painel admin (aberto num modal). Edita
 * uma cópia do usuário e só manda pra API ao salvar. Se a API recusar (ex.:
 * e-mail que já existe), mostra a mensagem e mantém o que foi digitado.
 */
export function FormularioEdicaoUsuario({
  usuario,
  onSalvar,
  onCancelar,
}: FormularioEdicaoUsuarioProps) {
  // cópia editável; a função inicial só roda quando o formulário é criado
  const [rascunho, setRascunho] = useState<Usuario>(() => ({ ...usuario }));
  const [erro, setErro] = useState<string | null>(null);
  // true enquanto o PUT não volta (desabilita os botões)
  const [salvando, setSalvando] = useState(false);

  function atualizarCampo(campo: CampoEditavelUsuario, valor: string) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
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
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar(paraCamposAtualizacao(rascunho));
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
