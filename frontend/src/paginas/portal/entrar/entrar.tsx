import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cabecalho from "../../../componentes/layout/Cabecalho/Cabecalho";
import Rodape from "../../../componentes/layout/Rodape/Rodape";
import Container from "../../../componentes/layout/Container/Container";
import { useAuth } from "../../../contexto/AuthContext";
import { ApiError } from "../../../services/api";
import "./entrar.css";

// vitrine do que a conta oferece, exibida abaixo do formulário (ainda não são links)
const RECURSOS_CONTA = [
  {
    id: "perfil",
    titulo: "Informações do perfil",
    descricao: "Dados pessoais e da conta",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
  {
    id: "enderecos",
    titulo: "Endereços",
    descricao: "Endereços cadastrados na sua conta",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    id: "compras",
    titulo: "Compras",
    descricao: "Suas compras antigas",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.55l1.65-7.45H5.12" />
      </svg>
    ),
  },
];

/**
 * Tela de login (rota "/entrar"), conectada ao backend via useAuth
 * (POST /api/auth/login). Em caso de sucesso, manda pro perfil.
 */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(email, senha);
      navigate("/perfil");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-entrar">
        <Container className="pagina-entrar__interno">
          <h1 className="pagina-entrar__mensagem">
            Olá! Você precisa realizar o login para entrar no seu perfil
          </h1>

          <form className="pagina-entrar__formulario" onSubmit={handleSubmit}>
            <label>
              E-mail
              <input
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                placeholder="••••••••"
                required
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
              />
            </label>

            {errorMessage && (
              <p className="pagina-entrar__erro" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="pagina-entrar__enviar"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <Link to="/criar-conta" className="pagina-entrar__link-cadastro">
            Criar conta
          </Link>
        </Container>

        <Container>
          <div className="pagina-entrar__recursos">
            {RECURSOS_CONTA.map((recurso) => (
              <div key={recurso.id} className="pagina-entrar__recurso">
                <span className="pagina-entrar__icone-recurso">
                  {recurso.icone}
                </span>
                <div className="pagina-entrar__texto-recurso">
                  <strong>{recurso.titulo}</strong>
                  <span>{recurso.descricao}</span>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default LoginPage;
