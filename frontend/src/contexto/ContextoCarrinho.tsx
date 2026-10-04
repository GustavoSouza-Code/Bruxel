import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Produto } from "../tipos/produto";

/** Uma linha do carrinho: o produto e quantas unidades dele foram adicionadas. */
export interface LinhaCarrinho {
  produto: Produto;
  quantidade: number;
}

/** Tudo que os componentes conseguem ler e usar do carrinho via useCarrinho(). */
interface ValorContextoCarrinho {
  /** linhas do carrinho, na ordem em que foram adicionadas */
  itens: LinhaCarrinho[];
  /** total de unidades (soma das quantidades); é o número do badge no Cabecalho */
  quantidadeItens: number;
  /** valor total em reais (preço × quantidade de cada item) */
  total: number;
  /** adiciona 1 unidade; se o produto já está no carrinho, só aumenta a quantidade */
  adicionarItem: (produto: Produto) => void;
  /** tira o produto do carrinho, qualquer que seja a quantidade */
  removerItem: (produtoId: string) => void;
  /** define a quantidade exata; abaixo de 1 o item é removido */
  atualizarQuantidade: (produtoId: string, quantidade: number) => void;
}

// começa como null pra useCarrinho() conseguir detectar o uso fora do ProvedorCarrinho
const ContextoCarrinho = createContext<ValorContextoCarrinho | null>(null);

/**
 * Guarda o carrinho e o disponibiliza pra árvore inteira (páginas, Cabecalho,
 * CardProduto). Precisa envolver o app — ver App.tsx.
 *
 * O estado vive só na memória: recarregar a página esvazia o carrinho
 * (ainda não é salvo em localStorage nem no backend).
 */
export function ProvedorCarrinho({ children }: { children: ReactNode }) {
  const [itens, setItems] = useState<LinhaCarrinho[]>([]);

  function adicionarItem(produto: Produto) {
    // a forma com função (current) garante partir sempre do valor mais recente do estado
    setItems((current) => {
      const existing = current.find(
        (item) => item.produto.id === produto.id
      );
      // já está no carrinho: só soma 1 na quantidade
      if (existing) {
        return current.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      // primeira vez: entra no fim da lista com quantidade 1
      return [...current, { produto, quantidade: 1 }];
    });
  }

  function removerItem(produtoId: string) {
    setItems((current) =>
      current.filter((item) => item.produto.id !== produtoId)
    );
  }

  function atualizarQuantidade(produtoId: string, quantidade: number) {
    // clicar em "−" com quantidade 1 remove o item em vez de deixar quantidade 0
    if (quantidade < 1) {
      removerItem(produtoId);
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.produto.id === produtoId ? { ...item, quantidade } : item
      )
    );
  }

  // totais derivados dos itens; o useMemo só recalcula quando `itens` muda, não a cada renderização
  const quantidadeItens = useMemo(
    () => itens.reduce((sum, item) => sum + item.quantidade, 0),
    [itens]
  );

  const total = useMemo(
    () =>
      itens.reduce(
        (sum, item) => sum + item.produto.preco * item.quantidade,
        0
      ),
    [itens]
  );

  return (
    <ContextoCarrinho.Provider
      value={{ itens, quantidadeItens, total, adicionarItem, removerItem, atualizarQuantidade }}
    >
      {children}
    </ContextoCarrinho.Provider>
  );
}

/**
 * Atalho pra acessar o carrinho: `const { itens, adicionarItem, total } = useCarrinho()`.
 * Lança erro se for usado fora do ProvedorCarrinho, pro problema aparecer logo
 * em vez de virar um carrinho "vazio" silencioso.
 */
export function useCarrinho() {
  const context = useContext(ContextoCarrinho);
  if (!context) {
    throw new Error("useCarrinho deve ser usado dentro de um ProvedorCarrinho");
  }
  return context;
}
