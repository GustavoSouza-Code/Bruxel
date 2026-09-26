import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Container } from "../Container/Container";
import { useCart } from "../../../context/CartContext";
import { useScrollEdges } from "../../../hooks/useScrollEdges";
import "./Header.css";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Sobre", href: "/sobre" },
  { label: "Piscinator", href: "/piscinator" },
  { label: "Loja virtual", href: "/loja" },
];

const SCROLL_THRESHOLD = 8;

export function Header() {
  const { itemCount } = useCart();
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);
  const { canScrollLeft, canScrollRight } = useScrollEdges(navRef);

  // no celular os links rolam na horizontal: garante que o da página
  // atual fique visível (ex.: "Loja virtual", que fica no fim da faixa)
  useEffect(() => {
    const nav = navRef.current;
    const link = activeLinkRef.current;
    if (!nav || !link) return;
    nav.scrollLeft = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
  }, [pathname]);

  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    setHeaderHeight(headerEl.offsetHeight);

    const observer = new ResizeObserver(() => {
      setHeaderHeight(headerEl.offsetHeight);
    });
    observer.observe(headerEl);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > SCROLL_THRESHOLD);
        ticking = false;
      });
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={`header${scrolled ? " header--scrolled" : ""}`}
      >
        <Container className="header__inner">
          <div className="header__logo">
            <span className="header__logo-main">Bruxel</span>
            <span className="header__logo-sub">Piscinas</span>
          </div>

          <nav
            ref={navRef}
            className={[
              "header__nav",
              canScrollLeft && "header__nav--fade-left",
              canScrollRight && "header__nav--fade-right",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {NAV_LINKS.map((link) => {
              const isActive = link.href === pathname;
              return (
                <Link
                  key={link.href}
                  ref={isActive ? activeLinkRef : undefined}
                  to={link.href}
                  className={`header__nav-link${isActive ? " header__nav-link--active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="header__actions">
            <Link to="/carrinho" className="header__icon-button" aria-label="Carrinho">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.55l1.65-7.45H5.12" />
              </svg>
              {itemCount > 0 && (
                <span className="header__cart-badge">{itemCount}</span>
              )}
            </Link>
            <Link to="/entrar" className="header__login-button">
              <svg
                className="header__login-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
              Entrar
            </Link>
          </div>
        </Container>
      </header>
      <div aria-hidden="true" style={{ height: headerHeight }} />
    </>
  );
}

export default Header;
