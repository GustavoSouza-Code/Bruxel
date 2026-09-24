import { useMemo, useState } from "react";
import { Header } from "../../../components/layout/Header/Header";
import { StoreHero } from "./components/StoreHero/StoreHero";
import { CategoryNav } from "./components/CategoryNav/CategoryNav";
import { ProductsSection } from "../../../components/product/ProductsSection/ProductsSection";
import { Footer } from "../../../components/layout/Footer/Footer";
import { ALL_PRODUCTS } from "../../../data/products";
import type { ProductCategory } from "../../../types/product";

const CATEGORY_SECTIONS: { id: ProductCategory; title: string }[] = [
  { id: "tratamento-agua", title: "Tratamento da água" },
  { id: "limpeza-piscina", title: "Limpeza da Piscina" },
  { id: "filtracao-circulacao", title: "Filtração e circulação" },
  { id: "acessorios-lazer", title: "Acessórios & Lazer" },
];

export function StorePage() {
  const [searchTerm, setSearchTerm] = useState("");

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

      <ProductsSection
        title="Produtos mais vendidos"
        products={filteredProducts.slice(0, 4)}
      />

      {CATEGORY_SECTIONS.map((section) => {
        const products = filteredProducts.filter(
          (product) => product.category === section.id
        );
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
