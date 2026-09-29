import type { Product } from "../../../types/product";
import { useCart } from "../../../context/CartContext";
import "./ProductCard.css";

interface ProductCardProps {
  product: Product;
  /** chamada ao clicar no ♡; opcional e ainda não usada por nenhuma página (o botão não faz nada por enquanto) */
  onToggleFavorite?: (productId: string) => void;
}

/**
 * Card de produto: imagem, nome, embalagem, preço e botão de adicionar ao
 * carrinho. É usado na Home, na Loja e no resultado do Piscinator.
 */
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

      {/* toFixed(2) garante 2 casas decimais; o replace troca o ponto pela vírgula (formato brasileiro) */}
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
