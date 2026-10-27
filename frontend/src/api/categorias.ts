import { requisicao } from "./cliente";
import type { Categoria } from "../tipos/produto";

/**
 * Lista as categorias (GET /categories, rota pública, ordenada por nome). Se a
 * chamada falhar, o useCatalogo segue sem categorias (os produtos aparecem normalmente).
 */
export function listarCategorias() {
  return requisicao<Categoria[]>("/categories");
}

/** Cria a categoria (POST /categories, só admin). 409 se o nome já existe. */
export function criarCategoria(token: string, nome: string) {
  return requisicao<Categoria>("/categories", { metodo: "POST", corpo: { nome }, token });
}

/** Renomeia a categoria (PUT /categories/:id, só admin). */
export function atualizarCategoria(token: string, id: string, nome: string) {
  return requisicao<Categoria>(`/categories/${id}`, { metodo: "PUT", corpo: { nome }, token });
}

/** Apaga a categoria (DELETE /categories/:id, só admin). 409 se ainda tem produtos. */
export async function excluirCategoria(token: string, id: string): Promise<void> {
  await requisicao<unknown>(`/categories/${id}`, { metodo: "DELETE", token });
}
