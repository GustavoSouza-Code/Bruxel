import type { ReactNode } from "react";
import "./Container.css";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Envelope de largura máxima usado dentro de cada seção, pra tudo alinhar
 * na mesma coluna central em telas grandes (evita o conteúdo esticar até
 * a borda da tela num monitor wide).
 */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={`container${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

export default Container;
