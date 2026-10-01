import { useMemo, useState } from "react";
import { Header } from "../../../components/layout/Header/Header";
import { StoreHero } from "./components/StoreHero/StoreHero";
import { CategoryNav } from "./components/CategoryNav/CategoryNav";
import { ProductsSection } from "../../../components/product/ProductsSection/ProductsSection";
import { Footer } from "../../../components/layout/Footer/Footer";
import { ALL_PRODUCTS } from "../../../data/products";
import type { ProductCategory } from "../../../types/product";

// seções da Loja, na ordem em que aparecem; o id é o slug da categoria e vira
// a âncora que o CategoryNav usa pra rolar até a seção
const CATEGORY_SECTIONS: { id: ProductCategory; title: string }[] = [
  { id: "tratamento-agua", title: "Tratamento da água" },
  { id: "limpeza-piscina", title: "Limpeza da Piscina" },
  { id: "filtracao-circulacao", title: "Filtração e circulação" },
  { id: "acessorios-lazer", title: "Acessórios & Lazer" },
];

/**
 * Loja virtual (rota "/loja"): busca por nome no topo, atalhos de categoria
 * e uma seção de produtos por categoria.
 */
export function StorePage() {
  // texto digitado no campo de busca do StoreHero
  const [searchTerm, setSearchTerm] = useState("");

  // busca por nome, sem diferenciar maiúsculas de minúsculas; campo vazio mostra tudo
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return ALL_PRODUCTS;
    return ALL_PRODUCTS.filter((product) =>
      product.name.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <>
      <Header />
      <StoreHero searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <CategoryNav />

      {/* destaques: os 4 primeiros do resultado (ALL_PRODUCTS começa pelos FEATURED_PRODUCTS) */}
      <ProductsSection
        title="Produtos mais vendidos"
        products={filteredProducts.slice(0, 4)}
      />

      {/* uma seção por categoria; o id vira a âncora do CategoryNav */}
      {CATEGORY_SECTIONS.map((section) => {
        const products = filteredProducts.filter(
          (product) => product.category === section.id
        );
        // categoria sem produtos (ex.: a busca não achou nada nela) não aparece
        if (products.length === 0) return null;

        return (
          <ProductsSection
            key={section.id}
            id={section.id}
            title={section.title}
            products={products}
          />
        );
      })}

      <Footer />
    </>
  );
}

export default StorePage;
