import { Link } from "react-router-dom";
import { Header } from "../../components/Header/Header";
import { Footer } from "../../components/Footer/Footer";
import { Container } from "../../components/Container/Container";
import "./Login.css";

const ACCOUNT_FEATURES = [
  {
    id: "perfil",
    title: "Informações do perfil",
    description: "Dados pessoais e da conta",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
  {
    id: "enderecos",
    title: "Endereços",
    description: "Endereços cadastrados na sua conta",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    id: "compras",
    title: "Compras",
    description: "Suas compras antigas",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.55l1.65-7.45H5.12" />
      </svg>
    ),
  },
];

export function LoginPage() {
  return (
    <>
      <Header />

      <section className="login-page">
        <Container className="login-page__inner">
          <h1 className="login-page__message">
            Olá! Você precisa realizar o login para entrar no seu perfil
          </h1>

          <form
            className="login-page__form"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              E-mail
              <input type="email" placeholder="seu@email.com" required />
            </label>
            <label>
              Senha
              <input type="password" placeholder="••••••••" required />
            </label>
            <button type="submit" className="login-page__submit">
              Entrar
            </button>
          </form>

          <Link to="/criar-conta" className="login-page__signup-link">
            Criar conta
          </Link>
        </Container>

        <Container>
          <div className="login-page__features">
            {ACCOUNT_FEATURES.map((feature) => (
              <div key={feature.id} className="login-page__feature">
                <span className="login-page__feature-icon">
                  {feature.icon}
                </span>
                <div className="login-page__feature-text">
                  <strong>{feature.title}</strong>
                  <span>{feature.description}</span>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

export default LoginPage;
