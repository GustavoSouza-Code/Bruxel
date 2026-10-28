import type { ReactNode } from "react";
import "./Recolhivel.css";

interface RecolhivelProps {
  /** id do painel: o botão que abre e fecha aponta pra ele com aria-controls */
  id: string;
  aberto: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Painel que abre e fecha com a altura suave (resposta do FAQ, painel de
 * filtros). Só o painel: o botão continua com quem já o tem, com
 * aria-expanded e aria-controls apontando pro `id`.
 *
 * Fica sempre no DOM, pra a animação ter de onde partir; fechado, recebe
 * `inert`, então o Tab e o leitor de tela pulam o que está escondido.
 */
export function Recolhivel({ id, aberto, children, className }: RecolhivelProps) {
  return (
    <div
      id={id}
      className={className ? `recolhivel ${className}` : "recolhivel"}
      data-aberto={aberto}
      inert={!aberto}
    >
      <div className="recolhivel__interno">{children}</div>
    </div>
  );
}

export default Recolhivel;
