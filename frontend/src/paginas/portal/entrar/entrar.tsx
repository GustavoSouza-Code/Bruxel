import { Link } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import "./entrar.css";

// vitrine do que a conta oferece, exibida abaixo do formulário (ainda não são links)
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

/**
 * Tela de login (rota "/entrar"). Por enquanto é só a interface: o envio do
 * formulário é bloqueado (preventDefault) e nada é enviado ao backend.
 */
export function PaginaEntrar() {
  return (
    <>
      <Cabecalho />

      <section className="pagina-entrar">
        <Container className="pagina-entrar__interno">
          <h1 className="pagina-entrar__mensagem">
            Olá! Você precisa realizar o login para entrar no seu perfil
          </h1>

          {/* TODO: integrar com o backend (login); hoje o botão "Entrar" não faz nada */}
          <form
            className="pagina-entrar__formulario"
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
            <button type="submit" className="pagina-entrar__enviar">
              Entrar
            </button>
          </form>

          <Link to="/criar-conta" className="pagina-entrar__link-cadastro">
            Criar conta
          </Link>
        </Container>

        <Container>
          <div className="pagina-entrar__recursos">
            {ACCOUNT_FEATURES.map((feature) => (
              <div key={feature.id} className="pagina-entrar__recurso">
                <span className="pagina-entrar__icone-recurso">
                  {feature.icon}
                </span>
                <div className="pagina-entrar__texto-recurso">
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

      <Rodape />
    </>
  );
}

export default PaginaEntrar;
