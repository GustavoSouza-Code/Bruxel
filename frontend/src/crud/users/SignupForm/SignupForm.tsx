import { useState } from "react";
import type { FormEvent } from "react";
import "./SignupForm.css";

/** O que o formulário entrega ao ser enviado (a confirmação de senha fica só aqui dentro). */
export interface SignupFormData {
  nome: string;
  email: string;
  /** só dígitos, igual ao banco */
  cpf: string;
  senha: string;
}

interface SignupFormProps {
  onSubmit: (data: SignupFormData) => void;
  /** texto do botão de enviar; padrão "Criar conta" */
  submitLabel?: string;
}

/**
 * Formulário de cadastro de usuário, usado no "/criar-conta" e no modal de
 * "Novo usuário" do painel admin. Confere se as duas senhas são iguais antes
 * de chamar onSubmit e limpa os campos depois de enviar.
 */
export function SignupForm({
  onSubmit,
  submitLabel = "Criar conta",
}: SignupFormProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // mensagem de erro mostrada acima do botão; null = sem erro
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (senha !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    onSubmit({ nome, email, cpf, senha });

    setNome("");
    setEmail("");
    setCpf("");
    setSenha("");
    setConfirmPassword("");
    setError(null);
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
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
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </label>

      {error && (
        <p className="signup-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="signup-form__submit">
        {submitLabel}
      </button>
    </form>
  );
}

export default SignupForm;
