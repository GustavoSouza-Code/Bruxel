import { Link } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import { MenuUsuario } from "../MenuUsuario/MenuUsuario";
import "./NavAdmin.css";

/**
 * Barra de navegação do painel de gestão. Substitui o Cabecalho do site nas
 * páginas /admin/*: tem o logo (volta pra Home), o "Painel de gestão" (volta
 * pra tela inicial do painel) e a pílula do usuário, com o Sair dentro do menu.
 */
export function NavAdmin() {
  return (
    <header className="nav-admin">
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
