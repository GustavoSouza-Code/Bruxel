import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header/Header";
import { Footer } from "../../../components/layout/Footer/Footer";
import { Container } from "../../../components/layout/Container/Container";
import { SignupForm } from "../../../components/user/SignupForm/SignupForm";
import "./Signup.css";

/**
 * Tela de cadastro (rota "/criar-conta"). Por enquanto é só a interface: o
 * SignupForm valida as senhas, mas nada é enviado ao backend.
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

          {/* TODO: integrar com o backend (POST /api/users) */}
          <SignupForm onSubmit={() => {}} />

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
