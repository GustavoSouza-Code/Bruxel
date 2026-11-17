import { Link } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import { MenuUsuario } from "../MenuUsuario/MenuUsuario";
import "./NavAdmin.css";

interface NavAdminProps {
  menuAberto: boolean;
  aoAbrirMenu: () => void;
}

/**
 * Barra de navegação do painel de gestão. Substitui o Cabecalho do site nas
 * páginas /admin/* (vem do LayoutAdmin): tem o botão que abre a lista lateral
 * (só no celular), o logo (volta pra Home), o "Painel de gestão" (volta pra
 * dashboard) e a pílula do usuário, com o Sair dentro do menu.
 */
export function NavAdmin({ menuAberto, aoAbrirMenu }: NavAdminProps) {
  return (
    <header className="nav-admin">
      <button
        type="button"
        className="nav-admin__menu"
        aria-label="Abrir menu do painel"
        aria-expanded={menuAberto}
        aria-controls="lateral-admin"
        onClick={aoAbrirMenu}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>
      <Logo />
      <Link to="/admin" className="nav-admin__titulo">
        {/* no celular fica só "Painel", senão logo + título + pílula não cabem na largura */}
        Painel<span className="nav-admin__titulo-extra"> de gestão</span>
      </Link>
      <MenuUsuario />
    </header>
  );
}

export default NavAdmin;
