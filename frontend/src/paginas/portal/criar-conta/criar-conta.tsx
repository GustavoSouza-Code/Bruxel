import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cabecalho from "../../../componentes/layout/Cabecalho/Cabecalho";
import Rodape from "../../../componentes/layout/Rodape/Rodape";
import Container from "../../../componentes/layout/Container/Container";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import type { DadosFormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import { userService } from "../../../services/userService";
import "./criar-conta.css";

/**
 * Tela de cadastro (rota "/criar-conta"), conectada ao backend via
 * POST /api/users (userService.create). O próprio FormularioCadastro mostra
 * erro de validação se a API recusar; aqui só cuidamos do que acontece
 * quando dá certo — mostrar a confirmação e mandar pro login.
 */
export function SignupPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  async function handleEnviar(data: DadosFormularioCadastro) {
    await userService.create({
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      cpf: data.cpf.replace(/\D/g, ""),
    });

    setSuccess(true);
    setTimeout(() => navigate("/entrar"), 1500);
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-criar-conta">
        <Container className="pagina-criar-conta__interno">
          <h1 className="pagina-criar-conta__mensagem">
            {success
              ? "Conta criada com sucesso! Redirecionando pro login..."
              : "Crie sua conta para aproveitar tudo que a Bruxel Piscinas tem pra oferecer"}
          </h1>

          {!success && (
            <>
              <FormularioCadastro onEnviar={handleEnviar} />

              <p className="pagina-criar-conta__link-login">
                Já tem uma conta? <Link to="/entrar">Entrar</Link>
              </p>
            </>
          )}
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default SignupPage;
