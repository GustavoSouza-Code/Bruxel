import type { Categoria } from "../../tipos/produto";

/** Nome legível da categoria a partir do id (ou "" se não achar). */
export function nomeDaCategoria(categorias: Categoria[], id: string) {
  return categorias.find((categoria) => categoria.id === id)?.nome ?? "";
}

/**
 * Opções do <select> de categoria. Se a categoria atual do produto não veio da
 * API (ex.: /categories fora do ar), entra uma opção "Categoria atual" pra o
 * select obrigatório continuar válido e dar pra editar o produto.
 */
export function opcoesDeCategoria(categorias: Categoria[], idAtual?: string): Categoria[] {
  if (!idAtual || categorias.some((categoria) => categoria.id === idAtual)) return categorias;
  return [{ id: idAtual, nome: "Categoria atual" }, ...categorias];
}
