import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Produto } from "../tipos/produto";
import { ContextoCarrinho } from "./useCarrinho";
import type { LinhaCarrinho } from "./useCarrinho";

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

  function limparCarrinho() {
    setItems([]);
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
      value={{ itens, quantidadeItens, total, adicionarItem, removerItem, atualizarQuantidade, limparCarrinho }}
    >
      {children}
    </ContextoCarrinho.Provider>
  );
}
