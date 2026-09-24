import type { Product } from "../../../types/product";
import { ProductCard } from "../ProductCard/ProductCard";
import { Container } from "../../layout/Container/Container";
import "./ProductsSection.css";

interface ProductsSectionProps {
  id?: string;
  title?: string;
  products: Product[];
  onSeeStore?: () => void;
}

export function ProductsSection({
  id,
  title = "Produtos mais vendidos",
  products,
  onSeeStore,
}: ProductsSectionProps) {
  return (
    <section id={id} className="products-section">
      <Container>
        <div className="products-section__header">
          <h2>{title}</h2>
          {onSeeStore && (
            <button
              className="products-section__store-button"
              onClick={onSeeStore}
            >
              Acessar loja virtual
            </button>
          )}
        </div>

        <div className="products-section__grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default ProductsSection;
