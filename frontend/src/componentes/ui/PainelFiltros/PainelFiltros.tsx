import type { ReactNode } from "react";
import { Recolhivel } from "../Recolhivel/Recolhivel";
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
 * BarraBusca. Abre e fecha com a altura suave (Recolhivel) e fica sempre no
 * DOM, pra o aria-controls do botão sempre apontar pra ele.
 */
export function PainelFiltros({ id, aberto, onLimpar, children }: PainelFiltrosProps) {
  return (
    <Recolhivel id={id} aberto={aberto}>
      {/* fundo, padding e margem ficam nesta caixa de dentro: fechado, o painel chega a altura 0 */}
      <div className="painel-filtros">
        <div className="painel-filtros__campos">{children}</div>
        <button type="button" className="painel-filtros__limpar" onClick={onLimpar}>
          Limpar filtros
        </button>
      </div>
    </Recolhivel>
  );
}

export default PainelFiltros;
