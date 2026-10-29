import type { Produto } from "../../tipos/produto";
import { contemTexto } from "../busca";
import { situacaoEstoque } from "./estoque";

export type OrdemProduto = "nome" | "preco-asc" | "preco-desc" | "estoque-asc";

/** "" = qualquer estoque; "baixo" inclui os esgotados. */
export type FiltroEstoque = "" | "baixo" | "esgotado";

/**
 * O que está escolhido na barra de busca, nos chips e no painel de filtros da
 * gestão de produtos. Os preços ficam como texto (o valor do input): "" = sem limite.
 */
export interface FiltrosProduto {
  busca: string;
  /** "" = todas as categorias */
  categoriaId: string;
  status: "" | "ativo" | "inativo";
  estoque: FiltroEstoque;
  precoMin: string;
  precoMax: string;
  ordem: OrdemProduto;
}

export const FILTROS_PRODUTO_INICIAIS: FiltrosProduto = {
  busca: "",
  categoriaId: "",
  status: "",
  estoque: "",
  precoMin: "",
  precoMax: "",
  ordem: "nome",
};

/**
 * Filtros iniciais a partir da URL, pra links como "/admin/produtos?estoque=baixo&status=ativo"
 * (a home do painel) já abrirem filtrados. Valor que o filtro não conhece é ignorado.
 */
export function filtrosProdutoDaUrl(parametros: URLSearchParams): FiltrosProduto {
  const estoque = parametros.get("estoque");
  const status = parametros.get("status");
  return {
    ...FILTROS_PRODUTO_INICIAIS,
    estoque: estoque === "baixo" || estoque === "esgotado" ? estoque : "",
    status: status === "ativo" || status === "inativo" ? status : "",
  };
}

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

// "baixo" pega os esgotados também (os dois pedem reposição); "esgotado" só os de estoque 0
function temEstoque(produto: Produto, filtro: FiltroEstoque) {
  const situacao = situacaoEstoque(produto.estoque);
  if (filtro === "baixo") return situacao !== "ok";
  if (filtro === "esgotado") return situacao === "esgotado";
  return true;
}

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
        temEstoque(produto, filtros.estoque) &&
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
    filtros.estoque !== "",
    filtros.precoMin.trim() !== "",
    filtros.precoMax.trim() !== "",
    filtros.ordem !== FILTROS_PRODUTO_INICIAIS.ordem,
  ].filter(Boolean).length;
}
