/** Categoria da loja (tabela `categories` do banco). */
export interface Categoria {
  id: string;
  nome: string;
}

/**
 * Produto vendido na loja. Os campos têm os mesmos nomes da tabela
 * `products` do banco, pra não precisar traduzir na hora de chamar a API.
 */
export interface Produto {
  id: string;
  /** id da categoria (vem da API de categorias) */
  categoria_id: string;
  /** código interno do produto; único no banco */
  codigo: string;
  /** nome que aparece no card; inclui a embalagem, ex.: "Hidrofloc 1L" */
  nome: string;
  descricao?: string;
  /** preço em reais, como número (a formatação "R$ 21,50" é feita na tela) */
  preco: number;
  estoque: number;
  /** imagem do produto: URL, ex.: "/produtos/x.png" (arquivos em public/produtos) */
  url_imagem?: string;
  /** produto inativo não deveria aparecer na loja */
  ativo: boolean;
}
