import { Link } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import "./criar-conta.css";

/**
 * Tela de cadastro (rota "/criar-conta"). Por enquanto é só a interface: o
 * FormularioCadastro valida as senhas, mas nada é enviado ao backend.
 */
export function PaginaCriarConta() {
  return (
    <>
      <Cabecalho />

      <section className="pagina-criar-conta">
        <Container className="pagina-criar-conta__interno">
          <h1 className="pagina-criar-conta__mensagem">
            Crie sua conta para aproveitar tudo que a Bruxel Piscinas tem
            pra oferecer
          </h1>

          {/* TODO: integrar com o backend (POST /api/users) */}
          <FormularioCadastro onEnviar={() => {}} />

          <p className="pagina-criar-conta__link-login">
            Já tem uma conta? <Link to="/entrar">Entrar</Link>
          </p>
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default PaginaCriarConta;
