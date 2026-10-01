import { Link } from "react-router-dom";
import "./NavAdmin.css";

/**
 * Barra de navegação do painel de gestão. Substitui o Cabecalho do site nas
 * páginas /admin/*: tem os atalhos de Usuários e Produtos e o link pra
 * voltar ao portal.
 */
export function NavAdmin() {
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
    </header>
  );
}

export default NavAdmin;
