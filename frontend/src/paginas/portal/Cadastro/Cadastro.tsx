import { Link } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import "./Cadastro.css";

/**
 * Tela de cadastro (rota "/criar-conta"). Por enquanto é só a interface: o
 * FormularioCadastro valida as senhas, mas nada é enviado ao backend.
 */
export function PaginaCadastro() {
  return (
    <>
      <Cabecalho />

      <section className="pagina-cadastro">
        <Container className="pagina-cadastro__interno">
          <h1 className="pagina-cadastro__mensagem">
            Crie sua conta para aproveitar tudo que a Bruxel Piscinas tem
            pra oferecer
          </h1>

          {/* TODO: integrar com o backend (POST /api/users) */}
          <FormularioCadastro onEnviar={() => {}} />

          <p className="pagina-cadastro__link-login">
            Já tem uma conta? <Link to="/entrar">Entrar</Link>
          </p>
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default PaginaCadastro;
