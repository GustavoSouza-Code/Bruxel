import { Link } from "react-router-dom";
import "./AdminNav.css";

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
