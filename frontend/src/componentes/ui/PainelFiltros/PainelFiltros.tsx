import type { ReactNode } from "react";
import "./PainelFiltros.css";

interface PainelFiltrosProps {
  /** o mesmo id passado como idPainel pra BarraBusca */
  id: string;
  aberto: boolean;
  onLimpar: () => void;
  /** os campos de filtro: um <label> com <select> ou <input> dentro, cada um */
  children: ReactNode;
}

/**
 * Caixa com os filtros extras da lista, aberta pelo botão "Filtros" da
 * BarraBusca. Fechado, continua no DOM com `hidden`, pra o aria-controls do
 * botão sempre apontar pra ele.
 */
export function PainelFiltros({ id, aberto, onLimpar, children }: PainelFiltrosProps) {
  return (
    <div id={id} className="painel-filtros" hidden={!aberto}>
      <div className="painel-filtros__campos">{children}</div>
      <button type="button" className="painel-filtros__limpar" onClick={onLimpar}>
        Limpar filtros
      </button>
    </div>
  );
}

export default PainelFiltros;
