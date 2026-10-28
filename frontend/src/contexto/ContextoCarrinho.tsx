import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Produto } from "../tipos/produto";
import { ContextoCarrinho } from "./useCarrinho";
import type { LinhaCarrinho } from "./useCarrinho";
import {
  CHAVE_CARRINHO,
  adicionarUnidade,
  definirQuantidade,
  lerCarrinhoSalvo,
  quantidadeNoCarrinho,
} from "../crud/carrinho/regrasCarrinho";

// lê o carrinho salvo; sem localStorage (navegação privada, bloqueado) começa vazio
function lerDoNavegador() {
  try {
    return lerCarrinhoSalvo(localStorage.getItem(CHAVE_CARRINHO));
  } catch {
    return [];
  }
}

/**
 * Guarda o carrinho e o disponibiliza pra árvore inteira (páginas, Cabecalho,
 * CardProduto). Precisa envolver o app — ver App.tsx.
 *
 * O carrinho fica salvo no localStorage do navegador: recarregar a página não
 * esvazia. As quantidades nunca passam do estoque do produto (regras em
 * crud/carrinho/regrasCarrinho.ts); o backend confere de novo ao fechar a compra.
 */
export function ProvedorCarrinho({ children }: { children: ReactNode }) {
  // a função no useState faz a leitura do localStorage só uma vez, ao montar
  const [itens, setItems] = useState<LinhaCarrinho[]>(lerDoNavegador);

  // a cada mudança, salva; se o navegador bloquear, o carrinho segue só na memória
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
    } catch {
      // sem localStorage não há onde salvar
    }
  }, [itens]);

  function adicionarItem(produto: Produto) {
    // a resposta sai da lista atual, antes de atualizar: false = esgotado ou no limite do estoque
    const cabe = quantidadeNoCarrinho(itens, produto.id) < produto.estoque;
    // a forma com função (current) garante partir sempre do valor mais recente do estado
    setItems((current) => adicionarUnidade(current, produto));
    return cabe;
  }

  function removerItem(produtoId: string) {
    setItems((current) => current.filter((item) => item.produto.id !== produtoId));
  }

  function atualizarQuantidade(produtoId: string, quantidade: number) {
    // abaixo de 1 o item sai; acima do estoque fica no estoque
    setItems((current) => definirQuantidade(current, produtoId, quantidade));
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
