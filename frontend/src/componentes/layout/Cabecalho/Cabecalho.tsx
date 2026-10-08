import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Container } from "../Container/Container";
import { useCarrinho } from "../../../contexto/ContextoCarrinho";
import { useBordasRolagem } from "../../../hooks/useBordasRolagem";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { MenuUsuario } from "../MenuUsuario/MenuUsuario";
import "./Cabecalho.css";

// links do menu principal, na ordem em que aparecem
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Sobre", href: "/sobre" },
  { label: "Piscinator", href: "/piscinator" },
  { label: "Loja virtual", href: "/loja" },
];

// a partir de quantos px de rolagem o header "encolhe" e ganha sombra
const SCROLL_THRESHOLD = 8;

/**
 * Cabeçalho fixo do site: logo, menu de navegação, carrinho (com o contador
 * de itens) e o botão Entrar, ou o menu do usuário quando há alguém logado.
 *
 * Como o header é `position: fixed` (sai do fluxo da página), um espaçador
 * do mesmo tamanho é renderizado logo depois dele pra o conteúdo não ficar
 * escondido por baixo. Ao rolar a página, o header encolhe e ganha sombra.
 */
export function Cabecalho() {
  const { quantidadeItens } = useCarrinho();
  const { estaLogado } = useAutenticacao();
  const headerRef = useRef<HTMLElement>(null);
  // altura real do header (muda com a tela e ao encolher); usada pelo espaçador no fim do componente
  const [headerHeight, setHeaderHeight] = useState(0);
  // vira true depois de rolar um pouco a página; liga a classe header--scrolled
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  // navRef = faixa de links; activeLinkRef = link da página atual (pra centralizar no celular)
  const navRef = useRef<HTMLElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);
  // diz se há links escondidos à esquerda/direita da faixa (liga os fades do CSS)
  const { canScrollLeft, canScrollRight } = useBordasRolagem(navRef);

  // no celular os links rolam na horizontal: garante que o da página
  // atual fique visível (ex.: "Loja virtual", que fica no fim da faixa)
  useEffect(() => {
    const nav = navRef.current;
    const link = activeLinkRef.current;
    if (!nav || !link) return;
    nav.scrollLeft = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
  }, [pathname]);

  // useLayoutEffect mede a altura antes de o navegador pintar a tela, evitando um
  // "pulo" do conteúdo; o ResizeObserver remede quando o header muda de tamanho
  // (encolher ao rolar, girar o celular)
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
    // throttle: no máximo 1 atualização por quadro (requestAnimationFrame), em vez de uma por evento de scroll
    let ticking = false;

    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > SCROLL_THRESHOLD);
        ticking = false;
      });
    }

    // já aplica o estado certo se a página abrir rolada (ex.: ao recarregar no meio dela)
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={`cabecalho${scrolled ? " cabecalho--rolado" : ""}`}
      >
        <Container className="cabecalho__interno">
          <div className="cabecalho__logo">
            <span className="cabecalho__logo-principal">Bruxel</span>
            <span className="cabecalho__logo-secundario">Piscinas</span>
          </div>

          {/* menu principal; as classes fade-* esmaecem a borda quando há links escondidos (só no celular) */}
          <nav
            ref={navRef}
            className={[
              "cabecalho__nav",
              canScrollLeft && "cabecalho__nav--esmaecer-esquerda",
              canScrollRight && "cabecalho__nav--esmaecer-direita",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {NAV_LINKS.map((link) => {
              // só o link da página atual recebe o destaque, o aria-current e a ref usada pra centralizá-lo
              const isActive = link.href === pathname;
              return (
                <Link
                  key={link.href}
                  ref={isActive ? activeLinkRef : undefined}
                  to={link.href}
                  className={`cabecalho__link-nav${isActive ? " cabecalho__link-nav--ativo" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="cabecalho__acoes">
            <Link to="/carrinho" className="cabecalho__botao-icone" aria-label="Carrinho">
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
              {/* badge só aparece com o carrinho não vazio */}
              {quantidadeItens > 0 && (
                <span className="cabecalho__selo-carrinho">{quantidadeItens}</span>
              )}
            </Link>
            {/* logado: menu com o nome; deslogado: o botão Entrar */}
            {estaLogado ? (
              <MenuUsuario />
            ) : (
              <Link to="/entrar" className="cabecalho__botao-entrar">
                <svg
                  className="cabecalho__icone-entrar"
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
            )}
          </div>
        </Container>
      </header>
      {/* espaçador: ocupa o lugar do header fixo pra o conteúdo da página começar abaixo dele */}
      <div aria-hidden="true" style={{ height: headerHeight }} />
    </>
  );
}

export default Cabecalho;
