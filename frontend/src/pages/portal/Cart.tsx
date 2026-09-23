import { Header } from "../../components/Header/Header";
import { Footer } from "../../components/Footer/Footer";
import { Container } from "../../components/Container/Container";
import { CartItem } from "../../components/CartItem/CartItem";
import { useCart } from "../../context/CartContext";
import "./Cart.css";

export function CartPage() {
  const { items, total, removeItem, updateQuantity } = useCart();

  return (
    <>
      <Header />

      <section className="cart-page">
        <Container>
          <nav className="cart-page__breadcrumb" aria-label="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Carrinho de compras</span>
          </nav>

          <h1 className="cart-page__title">Seu carrinho</h1>

          {items.length === 0 ? (
            <p className="cart-page__empty">
              Seu carrinho está vazio.{" "}
              <a href="/loja">Continue navegando pela loja virtual.</a>
            </p>
          ) : (
            <div className="cart-page__layout">
              <div className="cart-page__items">
                {items.map((item) => (
                  <CartItem
                    key={item.product.id}
                    item={item}
                    onRemove={removeItem}
                    onQuantityChange={updateQuantity}
                  />
                ))}
              </div>

              <aside className="cart-page__summary">
                <h2>Finalizar compra</h2>
                <div className="cart-page__summary-row">
                  <span>Produtos</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="cart-page__summary-row cart-page__summary-row--total">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
                <button className="cart-page__continue">Continuar</button>
              </aside>
            </div>
          )}
        </Container>
      </section>

      <Footer />
    </>
  );
}

export default CartPage;
