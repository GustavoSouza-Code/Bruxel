import type { Product } from "../../../types/product";
import { ProductCard } from "../ProductCard/ProductCard";
import { Container } from "../../layout/Container/Container";
import "./ProductsSection.css";

interface ProductsSectionProps {
  /** vira o id da <section>; o CategoryNav usa pra rolar até ela */
  id?: string;
  /** título da seção (padrão: "Produtos mais vendidos") */
  title?: string;
  products: Product[];
  /** se informado, mostra o botão "Acessar loja virtual" ao lado do título */
  onSeeStore?: () => void;
}

/**
 * Seção com título e uma grade de ProductCards. Serve tanto pra Home
 * (destaques) quanto pras seções por categoria da Loja.
 */
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
