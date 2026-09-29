/**
 * Slugs das categorias da loja. Cada um também é o `id` da seção na página
 * Loja (o CategoryNav usa esse id pra rolar até ela).
 */
export type ProductCategory =
  | "tratamento-agua"
  | "limpeza-piscina"
  | "filtracao-circulacao"
  | "acessorios-lazer";

/** Produto vendido na loja. */
export interface Product {
  id: string;
  name: string;
  /** variação do produto; por enquanto só é preenchida no cadastro do Admin (não aparece nos cards) */
  variant?: string;
  /** embalagem/peso, ex.: "1L" ou "10 KG/3KG/1KG"; aparece no card e no carrinho */
  packageInfo?: string;
  /** descrição/características; por enquanto só é preenchida no cadastro do Admin */
  description?: string;
  /** preço em reais, como número (a formatação "R$ 21,50" é feita na tela) */
  price: number;
  /** imagem do produto: asset importado (src/assets) ou uma URL */
  imageUrl: string;
  /** define em qual seção da Loja o produto aparece */
  category?: ProductCategory;
}
