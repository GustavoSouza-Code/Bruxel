export type ProductCategory =
  | "tratamento-agua"
  | "limpeza-piscina"
  | "filtracao-circulacao"
  | "acessorios-lazer";

export interface Product {
  id: string;
  name: string;
  variant?: string;
  packageInfo?: string;
  price: number;
  imageUrl: string;
  category?: ProductCategory;
}
