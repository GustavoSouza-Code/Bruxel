import type { ReactNode } from "react";

// base comum: traço na cor do texto (currentColor), decorativo pra leitores de tela
function Icone({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Ícones de traço usados no painel admin e no portal (atendimento). */
export function IconeBusca() {
  return (
    <Icone>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icone>
  );
}

export function IconeFiltros() {
  return (
    <Icone>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </Icone>
  );
}

export function IconeGrade() {
  return (
    <Icone>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </Icone>
  );
}

export function IconeLista() {
  return (
    <Icone>
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </Icone>
  );
}

export function IconeEditar() {
  return (
    <Icone>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4" />
      <path d="m13.5 6.5 4 4" />
    </Icone>
  );
}

export function IconeLixeira() {
  return (
    <Icone>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </Icone>
  );
}

/** Chave inglesa: serviço técnico (pílula "Solicitar atendimento" e tipo "Instalação"). */
export function IconeFerramenta() {
  return (
    <Icone>
      <path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5" />
    </Icone>
  );
}

/** Brilhos: limpeza e manutenção. */
export function IconeLimpeza() {
  return (
    <Icone>
      <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
    </Icone>
  );
}

/** Funil: bomba e filtro da piscina (não confundir com o IconeFiltros das listas). */
export function IconeFiltroPiscina() {
  return (
    <Icone>
      <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" />
    </Icone>
  );
}

/** Gota: vazamento. */
export function IconeGota() {
  return (
    <Icone>
      <path d="M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546z" />
    </Icone>
  );
}

/** Três pontos: outro tipo de serviço. */
export function IconeMaisOpcoes() {
  return (
    <Icone>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </Icone>
  );
}

/** Mais: adicionar foto. */
export function IconeMais() {
  return (
    <Icone>
      <path d="M12 5v14M5 12h14" />
    </Icone>
  );
}

/** X: remover foto. */
export function IconeFechar() {
  return (
    <Icone>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icone>
  );
}
