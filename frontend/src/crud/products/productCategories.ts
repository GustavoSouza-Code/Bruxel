import type { ProductCategory } from "../../types/product";

// opções do <select> de categoria (value = slug de ProductCategory); a lista do admin
// também usa pra trocar o slug pelo nome legível
export const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "tratamento-agua", label: "Tratamento da água" },
  { value: "limpeza-piscina", label: "Limpeza da Piscina" },
  { value: "filtracao-circulacao", label: "Filtração e circulação" },
  { value: "acessorios-lazer", label: "Acessórios & Lazer" },
];
