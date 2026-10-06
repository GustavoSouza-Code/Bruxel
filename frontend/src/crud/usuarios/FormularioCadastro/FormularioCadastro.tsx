import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../../services/api";
import "./FormularioCadastro.css";

/** O que o formulário entrega ao ser enviado (a confirmação de senha fica só aqui dentro). */
export interface DadosFormularioCadastro {
  nome: string;
  email: string;
  /** CPF como foi digitado; o service de API é quem limpa a pontuação antes de mandar pro backend */
  cpf: string;
  senha: string;
}

interface FormularioCadastroProps {
  /** pode ser async (chamar a API) — o formulário espera terminar antes de limpar os campos */
  onEnviar: (data: DadosFormularioCadastro) => void | Promise<void>;
  /** texto do botão de enviar; padrão "Criar conta" */
  textoBotao?: string;
}

/**
 * Formulário de cadastro de usuário, usado no "/criar-conta" e no modal de
 * "Novo usuário" do painel admin. Confere se as duas senhas são iguais,
 * chama onEnviar e só limpa os campos se ele não lançar erro — assim, se a
 * API recusar (CPF/e-mail já existe, por exemplo), o que a pessoa digitou
 * não se perde.
 */
export function FormularioCadastro({
  onEnviar,
  textoBotao = "Criar conta",
}: FormularioCadastroProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  // mensagem de erro mostrada acima do botão; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);
    try {
      await onEnviar({ nome, email, cpf, senha });
      setNome("");
      setEmail("");
      setCpf("");
      setSenha("");
      setConfirmarSenha("");
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : "Não foi possível criar a conta. Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario-cadastro" onSubmit={handleSubmit}>
      <label>
        Nome completo
        <input
          type="text"
          placeholder="Seu nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </label>
      <label>
        E-mail
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        CPF
        <input
          type="text"
          placeholder="Somente números"
          inputMode="numeric"
          maxLength={14}
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          required
        />
      </label>
      <label>
        Senha
        <input
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
      </label>
      <label>
        Confirmar senha
        <input
          type="password"
          placeholder="••••••••"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
        />
      </label>

      {erro && (
        <p className="formulario-cadastro__erro" role="alert">
          {erro}
        </p>
      )}

      <button
        type="submit"
        className="formulario-cadastro__enviar"
        disabled={enviando}
      >
        {enviando ? "Enviando..." : textoBotao}
      </button>
    </form>
  );
}

export default FormularioCadastro;
