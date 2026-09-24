import { Link } from "react-router-dom";
import { Header } from "../../components/Header/Header";
import { Footer } from "../../components/Footer/Footer";
import { Container } from "../../components/Container/Container";
import "./Signup.css";

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
