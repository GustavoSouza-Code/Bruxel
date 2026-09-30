import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "../types/product";

/** Uma linha do carrinho: o produto e quantas unidades dele foram adicionadas. */
export interface CartItem {
  product: Product;
  quantity: number;
}

/** Tudo que os componentes conseguem ler e usar do carrinho via useCart(). */
interface CartContextValue {
  /** linhas do carrinho, na ordem em que foram adicionadas */
  items: CartItem[];
  /** total de unidades (soma das quantidades); é o número do badge no Header */
  itemCount: number;
  /** valor total em reais (preço × quantidade de cada item) */
  total: number;
  /** adiciona 1 unidade; se o produto já está no carrinho, só aumenta a quantidade */
  addItem: (product: Product) => void;
  /** tira o produto do carrinho, qualquer que seja a quantidade */
  removeItem: (productId: string) => void;
  /** define a quantidade exata; abaixo de 1 o item é removido */
  updateQuantity: (productId: string, quantity: number) => void;
}

// começa como null pra useCart() conseguir detectar o uso fora do CartProvider
const CartContext = createContext<CartContextValue | null>(null);

/**
 * Guarda o carrinho e o disponibiliza pra árvore inteira (páginas, Header,
 * ProductCard). Precisa envolver o app — ver App.tsx.
 *
 * O estado vive só na memória: recarregar a página esvazia o carrinho
 * (ainda não é salvo em localStorage nem no backend).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(product: Product) {
    // a forma com função (current) garante partir sempre do valor mais recente do estado
    setItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );
      // já está no carrinho: só soma 1 na quantidade
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // primeira vez: entra no fim da lista com quantidade 1
      return [...current, { product, quantity: 1 }];
    });
  }

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }

  function updateQuantity(productId: string, quantity: number) {
    // clicar em "−" com quantidade 1 remove o item em vez de deixar quantidade 0
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }

  // totais derivados dos itens; o useMemo só recalcula quando `items` muda, não a cada renderização
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.preco * item.quantity,
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, itemCount, total, addItem, removeItem, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Atalho pra acessar o carrinho: `const { items, addItem, total } = useCart()`.
 * Lança erro se for usado fora do CartProvider, pro problema aparecer logo
 * em vez de virar um carrinho "vazio" silencioso.
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
