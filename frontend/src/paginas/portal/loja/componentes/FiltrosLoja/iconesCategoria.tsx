import type { ReactNode } from "react";
import { normalizar } from "../../../../../crud/produtos/selecaoProdutos";

// ícone de cada categoria no painel de filtros; cada um é um SVG inline que usa currentColor, então herda a cor do texto do botão;
// a chave é o nome da categoria normalizado (sem acento, minúsculo)
const ICONES: Record<string, ReactNode> = {
  "tratamento da agua": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69 7.4 8.2A6.5 6.5 0 1 0 16.6 8.2z" />
    </svg>
  ),
  "limpeza da piscina": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 5-7 7" />
      <path d="M11 5v6h6" />
      <path d="M4 21c2-3 4-4 4-8" />
      <path d="M4 21c3-1 5-1 7-4" />
    </svg>
  ),
  "filtracao e circulacao": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
    </svg>
  ),
  "acessorios & lazer": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12a10.06 10.06 0 0 0-20 0Z" />
      <path d="M12 12v8a2 2 0 0 0 4 0" />
      <path d="M12 2v1" />
    </svg>
  ),
};

// ícone padrão pra categoria cujo nome não está no mapa
const ICONE_PADRAO = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

/** Ícone da categoria pelo nome (sem ligar pra acento ou maiúsculas); nome desconhecido ganha o ícone padrão. */
export function iconeDaCategoria(nome: string): ReactNode {
  return ICONES[normalizar(nome)] ?? ICONE_PADRAO;
}
