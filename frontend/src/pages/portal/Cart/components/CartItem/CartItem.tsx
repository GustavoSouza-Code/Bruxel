import type { CartItem as CartItemType } from "../../../../../context/CartContext";
import "./CartItem.css";

interface CartItemProps {
  item: CartItemType;
  /** remove o produto do carrinho de vez */
  onRemove: (productId: string) => void;
  /** define a nova quantidade; o carrinho remove o item se ela ficar abaixo de 1 */
  onQuantityChange: (productId: string, quantity: number) => void;
}

/**
 * Uma linha do carrinho: imagem, nome, controle de quantidade e o subtotal
 * (preço × quantidade). O tipo do item é importado como CartItemType pra não
 * conflitar com o nome deste componente.
 */
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

      {/* subtotal deste item (preço × quantidade) */}
      <p className="cart-item__price">
        R$ <strong>{(product.price * quantity).toFixed(2).replace(".", ",")}</strong>
      </p>
    </div>
  );
}

export default CartItem;
