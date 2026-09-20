import type { Product } from "../../types/product";
import { useCart } from "../../context/CartContext";
import "./ProductCard.css";

interface ProductCardProps {
  product: Product;
  onToggleFavorite?: (productId: string) => void;
}

export function ProductCard({ product, onToggleFavorite }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <article className="product-card">
      <button
        className="product-card__favorite"
        aria-label="Favoritar produto"
        onClick={() => onToggleFavorite?.(product.id)}
      >
        ♡
      </button>

      <img
        className="product-card__image"
        src={product.imageUrl}
        alt={product.name}
      />

      <div className="product-card__info">
        <p className="product-card__name">{product.name}</p>
        {product.packageInfo && (
          <span className="product-card__package">{product.packageInfo}</span>
        )}
      </div>

      <p className="product-card__price">
        R$ <strong>{product.price.toFixed(2).replace(".", ",")}</strong>
      </p>

      <button
        className="product-card__add-button"
        onClick={() => addItem(product)}
      >
        Adicionar ao carrinho
      </button>
    </article>
  );
}

export default ProductCard;
