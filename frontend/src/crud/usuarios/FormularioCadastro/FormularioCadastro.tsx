import { useState } from "react";
import type { FormEvent } from "react";
import "./FormularioCadastro.css";

/** O que o formulário entrega ao ser enviado (a confirmação de senha fica só aqui dentro). */
export interface DadosFormularioCadastro {
  nome: string;
  email: string;
  /** só dígitos, igual ao banco */
  cpf: string;
  senha: string;
}

interface FormularioCadastroProps {
  onEnviar: (dados: DadosFormularioCadastro) => void;
  /** texto do botão de enviar; padrão "Criar conta" */
  textoBotao?: string;
}

/**
 * Formulário de cadastro de usuário, usado no "/criar-conta" e no modal de
 * "Novo usuário" do painel admin. Confere se as duas senhas são iguais antes
 * de chamar onEnviar e limpa os campos depois de enviar.
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

  function enviar(event: FormEvent) {
    event.preventDefault();

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    onEnviar({ nome, email, cpf, senha });

    setNome("");
    setEmail("");
    setCpf("");
    setSenha("");
    setConfirmarSenha("");
    setErro(null);
  }

  return (
    <form className="formulario-cadastro" onSubmit={enviar}>
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
          inputMode="numeric"
          placeholder="Só números"
          value={cpf}
          // tira tudo que não é dígito, pra ficar no formato do banco (11 dígitos)
          onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
          maxLength={11}
          minLength={11}
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

      <button type="submit" className="formulario-cadastro__enviar">
        {textoBotao}
      </button>
    </form>
  );
}

export default FormularioCadastro;
