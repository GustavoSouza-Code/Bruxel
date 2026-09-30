import { useState } from "react";
import type { FormEvent } from "react";
import "./SignupForm.css";

/** O que o formulário entrega ao ser enviado (a confirmação de senha fica só aqui dentro). */
export interface SignupFormData {
  name: string;
  email: string;
  password: string;
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // mensagem de erro mostrada acima do botão; null = sem erro
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    onSubmit({ name, email, password });

    setName("");
    setEmail("");
    setPassword("");
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
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        Senha
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
