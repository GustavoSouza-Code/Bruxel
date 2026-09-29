import { Link } from "react-router-dom";
import "./AdminNav.css";

/**
 * Barra de navegação do painel de gestão. Substitui o Header do site nas
 * páginas /admin/*: tem os atalhos de Usuários e Produtos e o link pra
 * voltar ao portal.
 */
export function AdminNav() {
  return (
    <header className="admin-nav">
      <span className="admin-nav__title">Painel de Gestão</span>
      <nav className="admin-nav__links">
        <Link to="/admin/usuarios" className="admin-nav__link">
          Usuários
        </Link>
        <Link to="/admin/produtos" className="admin-nav__link">
          Produtos
        </Link>
      </nav>
      <Link to="/" className="admin-nav__back">
        Voltar ao site
      </Link>
    </header>
  );
}

export default AdminNav;
