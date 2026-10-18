import { requisicao } from "./cliente";
import type { Categoria } from "../tipos/produto";

/** Lista as categorias (GET /categories, rota pública; o backend ainda vai criar essa rota). */
export function listarCategorias() {
  return requisicao<Categoria[]>("/categories");
}
