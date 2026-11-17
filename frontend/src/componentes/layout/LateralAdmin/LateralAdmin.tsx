import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ITENS_LATERAL, itemAtivo } from "./itensLateral";
import "./LateralAdmin.css";

// mesmos traços dos ícones que ficavam nos cartões da tela inicial
const propsIcone = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ICONES: Record<string, ReactNode> = {
  inicio: (
    <svg {...propsIcone}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  atendimentos: (
    <svg {...propsIcone}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  ),
  pedidos: (
    <svg {...propsIcone}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  pagamentos: (
    <svg {...propsIcone}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3" />
      <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
      <path d="M21 12h-4a2 2 0 0 0 0 4h4z" />
    </svg>
  ),
  produtos: (
    <svg {...propsIcone}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  ),
  clientes: (
    <svg {...propsIcone}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M16 3.5a4 4 0 0 1 0 9" />
      <path d="M22 21a7 7 0 0 0-4-6.3" />
    </svg>
  ),
};

interface LateralAdminProps {
  /** só conta no celular, onde a lateral é uma gaveta */
  aberta: boolean;
  aoFechar: () => void;
}

/**
 * Lista lateral do painel: as áreas de gestão, com a atual acesa, e o
 * "Abrir atendimento" no pé. No desktop fica fixa ao lado do conteúdo; no
 * celular vira uma gaveta aberta pelo botão de menu da NavAdmin, que fecha
 * com Esc, clique no fundo escuro ou ao trocar de página (ver LayoutAdmin).
 */
export function LateralAdmin({ aberta, aoFechar }: LateralAdminProps) {
  const { pathname } = useLocation();
  const ativo = itemAtivo(pathname);
  const primeiroRef = useRef<HTMLAnchorElement>(null);

  // gaveta aberta: Esc fecha e o foco vai pro primeiro item, pra navegar pelo teclado
  useEffect(() => {
    if (!aberta) return;
    primeiroRef.current?.focus();

    function aoApertarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", aoApertarTecla);
    return () => document.removeEventListener("keydown", aoApertarTecla);
  }, [aberta, aoFechar]);

  return (
    <>
      <div
        className={`lateral-admin__fundo${aberta ? " lateral-admin__fundo--visivel" : ""}`}
        onClick={aoFechar}
        aria-hidden="true"
      />
      <aside id="lateral-admin" className={`lateral-admin${aberta ? " lateral-admin--aberta" : ""}`}>
        <nav className="lateral-admin__nav" aria-label="Áreas do painel">
          {ITENS_LATERAL.map((item, i) => (
            <Link
              key={item.id}
              ref={i === 0 ? primeiroRef : undefined}
              to={item.rota}
              className="lateral-admin__item"
              aria-current={item.id === ativo ? "page" : undefined}
            >
              {ICONES[item.id]}
              {item.titulo}
            </Link>
          ))}
        </nav>

        <Link to="/solicitar-atendimento" className="lateral-admin__acao">
          <svg {...propsIcone} width={18} height={18}>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Abrir atendimento
        </Link>
      </aside>
    </>
  );
}

export default LateralAdmin;
