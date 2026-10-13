import { Link, useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import type { DadosFormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import { criarUsuario } from "../../../api/usuarios";
import "./criar-conta.css";

/**
 * Tela de cadastro (rota "/criar-conta"): envia os dados pro POST /api/users.
 * Se der certo, leva pro login com um aviso; se der errado (ex.: CPF já
 * cadastrado), o FormularioCadastro mostra a mensagem da API.
 */
export function PaginaCriarConta() {
  const navigate = useNavigate();

  async function cadastrar(dados: DadosFormularioCadastro) {
    await criarUsuario(dados);
    // a conta é criada deslogada: a pessoa entra em seguida com o e-mail e a senha
    navigate("/entrar", { state: { mensagem: "Conta criada! Entre com seu e-mail e senha." } });
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-criar-conta">
        <Container className="pagina-criar-conta__interno">
          <h1 className="pagina-criar-conta__mensagem">
            Crie sua conta para aproveitar tudo que a Bruxel Piscinas tem
            pra oferecer
          </h1>

          <FormularioCadastro onEnviar={cadastrar} />

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
