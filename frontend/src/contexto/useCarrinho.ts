import { createContext, useContext } from "react";
import type { Produto } from "../tipos/produto";

/** Uma linha do carrinho: o produto e quantas unidades dele foram adicionadas. */
export interface LinhaCarrinho {
  produto: Produto;
  quantidade: number;
}

/** Tudo que os componentes conseguem ler e usar do carrinho via useCarrinho(). */
export interface ValorContextoCarrinho {
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

// começa como null pra useCarrinho() conseguir detectar o uso fora do ProvedorCarrinho.
// Fica neste arquivo (e não no ContextoCarrinho.tsx) porque o Fast Refresh do Vite
// pede que arquivos de componente exportem só componentes
export const ContextoCarrinho = createContext<ValorContextoCarrinho | null>(null);

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
