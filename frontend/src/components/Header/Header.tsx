import { Container } from "../Container/Container";
import "./Header.css";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Sobre", href: "/sobre" },
  { label: "Piscinator", href: "/piscinator" },
  { label: "Loja virtual", href: "/loja" },
];

export function Header() {
  return (
    <header className="header">
      <Container className="header__inner">
        <div className="header__logo">
          <span className="header__logo-main">Bruxel</span>
          <span className="header__logo-sub">Piscinas</span>
        </div>

        <nav className="header__nav">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="header__nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header__actions">
          <button className="header__icon-button" aria-label="Carrinho">
            🛒
          </button>
          <button className="header__login-button">
            <span className="header__login-icon" aria-hidden="true">
              👤
            </span>
            Entrar
          </button>
        </div>
      </Container>
    </header>
  );
}

export default Header;
