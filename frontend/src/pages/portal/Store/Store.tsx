import { useMemo, useState } from "react";
import { Header } from "../../../components/layout/Header/Header";
import { StoreHero } from "./components/StoreHero/StoreHero";
import { CategoryNav } from "./components/CategoryNav/CategoryNav";
import { ProductsSection } from "../../../components/product/ProductsSection/ProductsSection";
import { Footer } from "../../../components/layout/Footer/Footer";
import { ALL_PRODUCTS } from "../../../data/products";
import { CATEGORIES } from "../../../crud/products/productCategories";

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
      product.nome.toLowerCase().includes(term)
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
      {CATEGORIES.map((category) => {
        const products = filteredProducts.filter(
          (product) => product.categoria_id === category.id
        );
        // categoria sem produtos (ex.: a busca não achou nada nela) não aparece
        if (products.length === 0) return null;

        return (
          <ProductsSection
            key={category.id}
            id={category.id}
            title={category.nome}
            products={products}
          />
        );
      })}

      <Footer />
    </>
  );
}

export default StorePage;
