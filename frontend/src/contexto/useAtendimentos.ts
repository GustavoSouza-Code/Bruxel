import { createContext, useContext } from "react";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";

/** Tudo que os componentes conseguem ler e usar dos atendimentos via useAtendimentos(). */
export interface ValorContextoAtendimentos {
  /** atendimentos do cliente, do mais novo pro mais antigo */
  atendimentos: Atendimento[];
  /** guarda uma solicitação nova no topo da lista, com status "aguardando" */
  solicitarAtendimento: (dados: DadosSolicitacao) => void;
}

// começa como null pra useAtendimentos() detectar o uso fora do ProvedorAtendimentos.
// Fica neste arquivo (e não no ContextoAtendimentos.tsx) pelo mesmo motivo do
// useAutenticacao.ts: o Fast Refresh do Vite pede que arquivos de componente exportem só componentes
export const ContextoAtendimentos = createContext<ValorContextoAtendimentos | null>(null);

/**
 * Atalho pra acessar os atendimentos: `const { atendimentos, solicitarAtendimento } = useAtendimentos()`.
 * Lança erro se for usado fora do ProvedorAtendimentos.
 */
export function useAtendimentos() {
  const contexto = useContext(ContextoAtendimentos);
  if (!contexto) {
    throw new Error("useAtendimentos deve ser usado dentro de um ProvedorAtendimentos");
  }
  return contexto;
}
