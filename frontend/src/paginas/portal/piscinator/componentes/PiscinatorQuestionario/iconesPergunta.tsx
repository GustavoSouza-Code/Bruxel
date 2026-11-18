import type { ReactNode } from "react";

// base: traço na cor do texto (currentColor), decorativo pra leitores de tela
function Icone({ children }: { children: ReactNode }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Um ícone por pergunta, na mesma ordem de PERGUNTAS (crud/produtos/recomendacaoPiscinator):
 * água verde, água turva, dias sem manutenção, paredes escorregadias, olhos ardendo,
 * folhas e sujeira, filtro fraco, chuva ou muito uso.
 */
const ICONES: ReactNode[] = [
  <Icone key="verde">
    <path d="M7.5 19.4c2.6 2.1 6.4 2.1 9 0 2.6-2.1 3.3-5.7 1.6-8.5l-4.9-7.3a1.4 1.4 0 0 0-2.3 0l-4.9 7.3c-1.7 2.8-1 6.4 1.5 8.5z" />
  </Icone>,
  <Icone key="turva">
    <path d="M6.5 18a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.7 9.5 4 4 0 0 1 17.5 18h-11z" />
  </Icone>,
  <Icone key="dias">
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M4 11h16" />
  </Icone>,
  <Icone key="paredes">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M3 15h18M9 4v6M15 10v5M9 15v5" />
  </Icone>,
  <Icone key="olhos">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icone>,
  <Icone key="folhas">
    <path d="M5 19C5 9 11 4 20 4c0 9-5 15-13 15M5 19c3-5 6-7 10-9" />
  </Icone>,
  <Icone key="filtro">
    <path d="M4 4h16v2.2a2 2 0 0 1-.6 1.4L15 12v7l-6 2v-8.5L4.5 7.6A2 2 0 0 1 4 6.2V4z" />
  </Icone>,
  <Icone key="chuva">
    <path d="M7 15a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 6.5 4.5 4.5 0 0 1 17.5 15H7z" />
    <path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
  </Icone>,
];

/** O ícone da pergunta de índice `indice` (0 = primeira); fora da lista não desenha nada. */
export function IconePergunta({ indice }: { indice: number }) {
  return <>{ICONES[indice] ?? null}</>;
}
