import { createContext, useContext } from "react";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";
import type { Ocupacao } from "../tipos/tecnico";

/** Tudo que os componentes conseguem ler e usar dos atendimentos via useAtendimentos(). */
export interface ValorContextoAtendimentos {
  /** atendimentos da conta logada (inclusive os abertos pela loja pra ela) e os exemplos, do mais novo pro mais antigo */
  atendimentos: Atendimento[];
  /** todos os pedidos, de todas as contas e do balcão (painel admin), do mais novo pro mais antigo */
  todosAtendimentos: Atendimento[];
  /** horários ocupados na agenda dos atendentes, juntando os pedidos de todas as contas */
  ocupacoes: Ocupacao[];
  /** guarda uma solicitação nova no topo da lista, com status "aguardando" */
  solicitarAtendimento: (dados: DadosSolicitacao) => void;
  /**
   * Troca um pedido pelo que `transformar` devolver (ex.: `confirmar`, `recusar` de andamento.ts).
   * `transformar` precisa ser pura: roda dentro do setState, que o StrictMode chama 2 vezes.
   */
  atualizarAtendimento: (id: string, transformar: (atual: Atendimento) => Atendimento) => void;
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
