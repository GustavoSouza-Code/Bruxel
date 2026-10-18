import type { Categoria } from "../../tipos/produto";

/** Nome legível da categoria a partir do id (ou "" se não achar). */
export function nomeDaCategoria(categorias: Categoria[], id: string) {
  return categorias.find((categoria) => categoria.id === id)?.nome ?? "";
}
