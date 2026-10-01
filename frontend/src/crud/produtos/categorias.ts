import type { Categoria } from "../../types/produto";

// categorias da loja, na ordem em que aparecem; o id também vira a âncora da
// seção na Loja (o CategoryNav rola até ela)
// TODO: trocar pelos dados do backend (tabela categories); lá os ids são UUIDs
export const CATEGORIAS: Categoria[] = [
  { id: "tratamento-agua", nome: "Tratamento da água" },
  { id: "limpeza-piscina", nome: "Limpeza da Piscina" },
  { id: "filtracao-circulacao", nome: "Filtração e circulação" },
  { id: "acessorios-lazer", nome: "Acessórios & Lazer" },
];

/** Nome legível da categoria a partir do id (ou "" se não achar). */
export function nomeDaCategoria(categoriaId: string) {
  return CATEGORIAS.find((categoria) => categoria.id === categoriaId)?.nome ?? "";
}
