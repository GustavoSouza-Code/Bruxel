import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header/Header";
import { Footer } from "../../../components/layout/Footer/Footer";
import { Container } from "../../../components/layout/Container/Container";
import "./Signup.css";

/**
 * Tela de cadastro (rota "/criar-conta"). Por enquanto é só a interface: o
 * envio do formulário é bloqueado (preventDefault) e nada é enviado ao backend.
 */
export function SignupPage() {
  return (
    <>
      <Header />

      <section className="signup-page">
        <Container className="signup-page__inner">
          <h1 className="signup-page__message">
            Crie sua conta para aproveitar tudo que a Bruxel Piscinas tem
            pra oferecer
          </h1>

          {/* TODO: integrar com o backend (cadastro) e validar se "Confirmar senha" é igual à senha */}
          <form
            className="signup-page__form"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              Nome completo
              <input type="text" placeholder="Seu nome completo" required />
            </label>
            <label>
              E-mail
              <input type="email" placeholder="seu@email.com" required />
            </label>
            <label>
              Senha
              <input type="password" placeholder="••••••••" required />
            </label>
            <label>
              Confirmar senha
              <input type="password" placeholder="••••••••" required />
            </label>
            <button type="submit" className="signup-page__submit">
              Criar conta
            </button>
          </form>

          <p className="signup-page__login-link">
            Já tem uma conta? <Link to="/entrar">Entrar</Link>
          </p>
        </Container>
      </section>

      <Footer />
    </>
  );
}

export default SignupPage;
