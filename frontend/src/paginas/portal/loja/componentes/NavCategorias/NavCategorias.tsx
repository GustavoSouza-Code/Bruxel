import type { ReactNode } from "react";
import { Container } from "../../../../../componentes/layout/Container/Container";
import "./NavCategorias.css";

/** Atalho de categoria; o id é o mesmo categoria_id usado como id da seção na página. */
interface CategoryShortcut {
  id: string;
  label: string;
  icon: ReactNode;
}

// cada ícone é um SVG inline que usa currentColor, então herda a cor do texto do botão
const CATEGORIES: CategoryShortcut[] = [
  {
    id: "tratamento-agua",
    label: "Tratamento da água",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69 7.4 8.2A6.5 6.5 0 1 0 16.6 8.2z" />
      </svg>
    ),
  },
  {
    id: "limpeza-piscina",
    label: "Limpeza da Piscina",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 5-7 7" />
        <path d="M11 5v6h6" />
        <path d="M4 21c2-3 4-4 4-8" />
        <path d="M4 21c3-1 5-1 7-4" />
      </svg>
    ),
  },
  {
    id: "filtracao-circulacao",
    label: "Filtração e circulação",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
      </svg>
    ),
  },
  {
    id: "acessorios-lazer",
    label: "Acessórios & Lazer",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12a10.06 10.06 0 0 0-20 0Z" />
        <path d="M12 12v8a2 2 0 0 0 4 0" />
        <path d="M12 2v1" />
      </svg>
    ),
  },
];

/** Barra de atalhos da Loja: cada botão rola suavemente até a seção da categoria. */
export function NavCategorias() {
  function handleClick(id: string) {
    // o id é o mesmo da <section> renderizada pelo SecaoProdutos (o scroll-margin-top
    // dela evita que o header fixo cubra o título)
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="nav-categorias">
      <Container className="nav-categorias__interno">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            className="nav-categorias__item"
            onClick={() => handleClick(category.id)}
          >
            {category.icon}
            {category.label}
          </button>
        ))}
      </Container>
    </nav>
  );
}

export default NavCategorias;
