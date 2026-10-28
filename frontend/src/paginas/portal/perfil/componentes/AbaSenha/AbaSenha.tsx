import { useState } from "react";
import type { FormEvent } from "react";
import { alterarSenha } from "../../../../../api/usuarios";
import { ErroApi, errosPorCampo, mensagemDeErro } from "../../../../../api/cliente";
import { useAutenticacao } from "../../../../../contexto/useAutenticacao";
import { useAvisos } from "../../../../../contexto/useAvisos";
import { validarTrocaSenha } from "../../../../../crud/usuarios/validarTrocaSenha";
import type { CamposTrocaSenha, ErrosTrocaSenha } from "../../../../../crud/usuarios/validarTrocaSenha";

const VAZIO: CamposTrocaSenha = { atual: "", nova: "", confirmacao: "" };

// os três campos, na ordem da tela; autoComplete ajuda o gerenciador de senhas do navegador
const CAMPOS: { campo: keyof CamposTrocaSenha; label: string; autoComplete: string }[] = [
  { campo: "atual", label: "Senha atual", autoComplete: "current-password" },
  { campo: "nova", label: "Nova senha", autoComplete: "new-password" },
  { campo: "confirmacao", label: "Confirmar nova senha", autoComplete: "new-password" },
];

/**
 * Aba "Senha" do /perfil: troca a senha da própria conta. Confere os campos
 * antes de enviar (validarTrocaSenha); a senha atual quem confere é o backend.
 * Usa as classes de formulário do perfil.css.
 */
export function AbaSenha() {
  const { usuario, token } = useAutenticacao();
  const { avisar } = useAvisos();
  const [campos, setCampos] = useState<CamposTrocaSenha>(VAZIO);
  const [erros, setErros] = useState<ErrosTrocaSenha>({});
  // erro que não é de um campo (ex.: servidor fora do ar)
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (!usuario || !token) return;
    const encontrados = validarTrocaSenha(campos);
    setErros(encontrados);
    setErroGeral(null);
    if (Object.keys(encontrados).length > 0) return;

    setSalvando(true);
    try {
      await alterarSenha(token, usuario.id, campos.atual, campos.nova);
      setCampos(VAZIO);
      avisar({ tipo: "sucesso", mensagem: "Senha alterada." });
    } catch (falha) {
      const porCampo = errosPorCampo(falha);
      if (porCampo.senha) {
        // regra de senha do backend: vai pro campo da nova senha
        setErros({ nova: porCampo.senha });
      } else if (falha instanceof ErroApi && falha.status === 400) {
        // 400 sem campo é o "Senha atual incorreta." do backend
        setErros({ atual: mensagemDeErro(falha) });
      } else {
        setErroGeral(mensagemDeErro(falha));
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="pagina-perfil__cabecalho-conteudo">
        <h2>Senha</h2>
      </div>

      <form className="pagina-perfil__formulario" onSubmit={enviar} noValidate>
        {CAMPOS.map(({ campo, label, autoComplete }) => (
          <label key={campo}>
            {label}
            <input
              type="password"
              autoComplete={autoComplete}
              value={campos[campo]}
              onChange={(e) => setCampos((atuais) => ({ ...atuais, [campo]: e.target.value }))}
              aria-invalid={Boolean(erros[campo])}
              aria-describedby={erros[campo] ? `erro-senha-${campo}` : undefined}
            />
            {erros[campo] && (
              <span id={`erro-senha-${campo}`} className="pagina-perfil__erro-campo">
                {erros[campo]}
              </span>
            )}
          </label>
        ))}

        {erroGeral && (
          <p className="pagina-perfil__erro" role="alert">
            {erroGeral}
          </p>
        )}
        <div className="pagina-perfil__acoes-formulario">
          <button type="submit" className="pagina-perfil__salvar" disabled={salvando}>
            {salvando ? "Salvando…" : "Alterar senha"}
          </button>
        </div>
      </form>
    </>
  );
}

export default AbaSenha;
