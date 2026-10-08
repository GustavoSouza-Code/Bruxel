import { startTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import "./NavAdmin.css";

/**
 * Barra de navegação do painel de gestão. Substitui o Cabecalho do site nas
 * páginas /admin/*: tem os atalhos de Usuários e Produtos, o link pra voltar
 * ao portal e o botão Sair.
 */
export function NavAdmin() {
  const { sair } = useAutenticacao();
  const navigate = useNavigate();

  function handleSair() {
    // o React Router navega dentro de uma transição (prioridade baixa); sem juntar as duas
    // coisas aqui, o sair() renderizaria antes e o RotaAdmin mandaria pro /entrar em vez da Home
    startTransition(() => {
      sair();
      navigate("/");
    });
  }

  return (
    <header className="nav-admin">
      <span className="nav-admin__titulo">Painel de Gestão</span>
      <nav className="nav-admin__links">
        <Link to="/admin/usuarios" className="nav-admin__link">
          Usuários
        </Link>
        <Link to="/admin/produtos" className="nav-admin__link">
          Produtos
        </Link>
      </nav>
      <Link to="/" className="nav-admin__voltar">
        Voltar ao site
      </Link>
      <button type="button" className="nav-admin__sair" onClick={handleSair}>
        Sair
      </button>
    </header>
  );
}

export default NavAdmin;
