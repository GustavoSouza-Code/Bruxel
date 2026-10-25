import { requisicao } from "./cliente";
import type { Categoria } from "../tipos/produto";

/**
 * Lista as categorias (GET /categories, rota pública, ordenada por nome). A rota
 * está na branch refatoracao-backend; enquanto ela não chega na main, a chamada
 * falha e o useCatalogo segue sem categorias (os produtos aparecem normalmente).
 */
export function listarCategorias() {
  return requisicao<Categoria[]>("/categories");
}
