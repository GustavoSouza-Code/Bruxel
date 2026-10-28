import type { Produto } from "../../tipos/produto";
import type { LinhaCarrinho } from "../../contexto/useCarrinho";

/** Onde o carrinho fica salvo no navegador (mesmo prefixo de bruxel:visualizacao:). */
export const CHAVE_CARRINHO = "bruxel:carrinho";

/** Quantas unidades do produto já estão no carrinho (0 se não está). */
export function quantidadeNoCarrinho(itens: LinhaCarrinho[], produtoId: string): number {
  return itens.find((item) => item.produto.id === produtoId)?.quantidade ?? 0;
}

/**
 * Põe mais 1 unidade, sem passar do estoque: no limite (ou esgotado) a lista
 * volta igual. Se o produto ainda não está no carrinho, entra no fim.
 */
export function adicionarUnidade(itens: LinhaCarrinho[], produto: Produto): LinhaCarrinho[] {
  const atual = quantidadeNoCarrinho(itens, produto.id);
  if (atual >= produto.estoque) return itens;
  if (atual === 0) return [...itens, { produto, quantidade: 1 }];
  return itens.map((item) => (item.produto.id === produto.id ? { ...item, quantidade: atual + 1 } : item));
}

/** Define a quantidade exata, limitada ao estoque; abaixo de 1 o item sai do carrinho. */
export function definirQuantidade(itens: LinhaCarrinho[], produtoId: string, quantidade: number): LinhaCarrinho[] {
  if (quantidade < 1) return itens.filter((item) => item.produto.id !== produtoId);
  return itens.map((item) =>
    item.produto.id === produtoId ? { ...item, quantidade: Math.min(quantidade, item.produto.estoque) } : item
  );
}

// uma linha salva só vale se tiver o mínimo que o carrinho usa pra desenhar e somar
function linhaValida(linha: unknown): linha is LinhaCarrinho {
  if (typeof linha !== "object" || linha === null) return false;
  const { produto, quantidade } = linha as Partial<LinhaCarrinho>;
  return (
    typeof produto === "object" &&
    produto !== null &&
    typeof produto.id === "string" &&
    typeof produto.nome === "string" &&
    typeof produto.preco === "number" &&
    typeof produto.estoque === "number" &&
    Number.isInteger(quantidade) &&
    (quantidade as number) >= 1
  );
}

/**
 * Lê o carrinho salvo (o texto do localStorage). Conteúdo quebrado ou de outro
 * formato vira carrinho vazio; linhas inválidas ou esgotadas são descartadas e
 * a quantidade fica limitada ao estoque guardado.
 */
export function lerCarrinhoSalvo(texto: string | null): LinhaCarrinho[] {
  if (!texto) return [];
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return [];
  }
  if (!Array.isArray(dados)) return [];
  return dados
    .filter(linhaValida)
    .filter((linha) => linha.produto.estoque > 0)
    .map((linha) => ({ ...linha, quantidade: Math.min(linha.quantidade, linha.produto.estoque) }));
}
