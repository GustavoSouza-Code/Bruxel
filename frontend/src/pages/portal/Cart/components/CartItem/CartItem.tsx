import type { CartItem as CartItemType } from "../../../../../context/CartContext";
import "./CartItem.css";

interface CartItemProps {
  item: CartItemType;
  onRemove: (productId: string) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
}

export function CartItem({ item, onRemove, onQuantityChange }: CartItemProps) {
  const { product, quantity } = item;

  return (
    <div className="cart-item">
      <button
        className="cart-item__remove"
        aria-label="Remover produto"
        onClick={() => onRemove(product.id)}
      >
        ×
      </button>

      <img className="cart-item__image" src={product.imageUrl} alt={product.name} />

      <div className="cart-item__info">
        <p className="cart-item__name">{product.name}</p>
        {product.packageInfo && (
          <span className="cart-item__package">
            Peso da unidade: {product.packageInfo}
          </span>
        )}

        <div className="cart-item__quantity">
          <span>Quantidade</span>
          <div className="cart-item__stepper">
            <button
              onClick={() => onQuantityChange(product.id, quantity - 1)}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => onQuantityChange(product.id, quantity + 1)}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <p className="cart-item__price">
        R$ <strong>{(product.price * quantity).toFixed(2).replace(".", ",")}</strong>
      </p>
    </div>
  );
}

export default CartItem;
