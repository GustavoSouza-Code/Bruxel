/** Categoria da loja (tabela `categories` do banco). */
export interface Category {
  id: string;
  nome: string;
}

/**
 * Produto vendido na loja. Os campos têm os mesmos nomes da tabela
 * `products` do banco, pra não precisar traduzir na hora de chamar a API.
 */
export interface Product {
  id: string;
  /** id da categoria (ver CATEGORIES em crud/products/productCategories.ts) */
  categoria_id: string;
  /** código interno do produto; único no banco */
  codigo: string;
  /** nome que aparece no card; inclui a embalagem, ex.: "Hidrofloc 1L" */
  nome: string;
  descricao?: string;
  /** preço em reais, como número (a formatação "R$ 21,50" é feita na tela) */
  preco: number;
  estoque: number;
  /** imagem do produto: asset importado (src/assets) ou uma URL */
  url_imagem?: string;
  /** produto inativo não deveria aparecer na loja */
  ativo: boolean;
}
