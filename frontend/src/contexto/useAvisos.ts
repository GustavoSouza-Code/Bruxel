import { createContext, useContext } from "react";

/** sucesso = algo foi salvo/feito; erro = algo falhou; info = só um recado. */
export type TipoAviso = "sucesso" | "erro" | "info";

/** O que a tela passa pro avisar(): o texto e, se fizer sentido, um link (ex.: "Ver carrinho"). */
export interface NovoAviso {
  tipo: TipoAviso;
  mensagem: string;
  acao?: { rotulo: string; para: string };
}

/** Aviso na fila, com o id que o provedor dá pra cada um. */
export interface Aviso extends NovoAviso {
  id: number;
}

export interface ValorContextoAvisos {
  /** mostra um aviso curto no canto da tela; some sozinho depois de alguns segundos */
  avisar: (aviso: NovoAviso) => void;
}

// fica neste arquivo (e não no ContextoAvisos.tsx) pelo mesmo motivo do useCarrinho:
// o Fast Refresh do Vite pede que arquivos de componente exportem só componentes
export const ContextoAvisos = createContext<ValorContextoAvisos | null>(null);

/**
 * Atalho pra mostrar avisos: `const { avisar } = useAvisos()` e depois
 * `avisar({ tipo: "sucesso", mensagem: "Produto salvo." })`.
 * Lança erro fora do ProvedorAvisos, pro problema aparecer logo.
 */
export function useAvisos() {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) {
    throw new Error("useAvisos deve ser usado dentro de um ProvedorAvisos");
  }
  return contexto;
}
