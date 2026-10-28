import type { Produto } from "../../tipos/produto";

/** A partir daqui o estoque é "baixo": a página do produto mostra "Últimas N unidades" e o painel avisa. */
export const POUCO_ESTOQUE = 3;

export type SituacaoEstoque = "esgotado" | "baixo" | "ok";

/** Esgotado (0 ou menos), baixo (até POUCO_ESTOQUE) ou ok. */
export function situacaoEstoque(estoque: number): SituacaoEstoque {
  if (estoque <= 0) return "esgotado";
  if (estoque <= POUCO_ESTOQUE) return "baixo";
  return "ok";
}

/**
 * Quantos produtos ativos estão com estoque baixo (os esgotados entram na conta)
 * e quantos estão esgotados. Inativo fica de fora: não está à venda.
 */
export function contarEstoque(produtos: Produto[]) {
  const ativos = produtos.filter((produto) => produto.ativo);
  return {
    baixo: ativos.filter((produto) => situacaoEstoque(produto.estoque) !== "ok").length,
    esgotados: ativos.filter((produto) => situacaoEstoque(produto.estoque) === "esgotado").length,
  };
}
