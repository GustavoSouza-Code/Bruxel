import type { Produto } from "../../tipos/produto";
import { contemTexto } from "../busca";

export type OrdemProduto = "nome" | "preco-asc" | "preco-desc" | "estoque-asc";

/**
 * O que está escolhido na barra de busca, nos chips e no painel de filtros da
 * gestão de produtos. Os preços ficam como texto (o valor do input): "" = sem limite.
 */
export interface FiltrosProduto {
  busca: string;
  /** "" = todas as categorias */
  categoriaId: string;
  status: "" | "ativo" | "inativo";
  precoMin: string;
  precoMax: string;
  ordem: OrdemProduto;
}

export const FILTROS_PRODUTO_INICIAIS: FiltrosProduto = {
  busca: "",
  categoriaId: "",
  status: "",
  precoMin: "",
  precoMax: "",
  ordem: "nome",
};

// texto do input → número; vazio ou inválido = sem limite (null)
function paraNumero(texto: string) {
  if (!texto.trim()) return null;
  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

const COMPARAR: Record<OrdemProduto, (a: Produto, b: Produto) => number> = {
  // numeric: "Filtro 2" vem antes de "Filtro 10"
  nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }),
  "preco-asc": (a, b) => a.preco - b.preco,
  "preco-desc": (a, b) => b.preco - a.preco,
  "estoque-asc": (a, b) => a.estoque - b.estoque,
};

/** Aplica os filtros e a ordenação; devolve uma lista nova (não altera a original). */
export function filtrarProdutos(produtos: Produto[], filtros: FiltrosProduto) {
  const precoMin = paraNumero(filtros.precoMin);
  const precoMax = paraNumero(filtros.precoMax);

  return produtos
    .filter(
      (produto) =>
        (contemTexto(produto.nome, filtros.busca) || contemTexto(produto.codigo, filtros.busca)) &&
        (!filtros.categoriaId || produto.categoria_id === filtros.categoriaId) &&
        (!filtros.status || produto.ativo === (filtros.status === "ativo")) &&
        (precoMin === null || produto.preco >= precoMin) &&
        (precoMax === null || produto.preco <= precoMax)
    )
    .sort(COMPARAR[filtros.ordem]);
}

/**
 * Quantos filtros do painel estão em uso (o número do botão "Filtros (n)").
 * A busca e a categoria ficam de fora porque já aparecem na tela.
 */
export function contarFiltrosAtivosProduto(filtros: FiltrosProduto) {
  return [
    filtros.status !== "",
    filtros.precoMin.trim() !== "",
    filtros.precoMax.trim() !== "",
    filtros.ordem !== FILTROS_PRODUTO_INICIAIS.ordem,
  ].filter(Boolean).length;
}
