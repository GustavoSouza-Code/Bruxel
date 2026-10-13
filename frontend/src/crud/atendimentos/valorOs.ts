import type { Atendimento, ProdutoUsado } from "../../tipos/atendimento";
import type { Produto } from "../../tipos/produto";

// "150", "150,5", "150.50": só dígitos, com até 2 casas depois da vírgula ou do ponto
const FORMATO_SIMPLES = /^\d+([.,]\d{1,2})?$/;
// "1.500", "1.500,00", "12.345,6": pontos separando os milhares (grupos de 3) e vírgula nos centavos
const FORMATO_MILHAR = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/;

const FORMATADOR_REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// conta com centavos sem lixo de ponto flutuante (0.1 * 3 = 0.30000000000000004)
function emCentavos(valor: number) {
  return Math.round(valor * 100) / 100;
}

export function subtotalProduto(produto: ProdutoUsado) {
  return emCentavos(produto.precoUnitario * produto.quantidade);
}

export function totalProdutos(produtos: ProdutoUsado[]) {
  return emCentavos(produtos.reduce((soma, produto) => soma + produto.precoUnitario * produto.quantidade, 0));
}

/** Mão de obra (null conta 0) + produtos. */
export function totalOs(atendimento: Pick<Atendimento, "produtosUsados" | "valorMaoDeObra">) {
  return emCentavos((atendimento.valorMaoDeObra ?? 0) + totalProdutos(atendimento.produtosUsados));
}

/** Quanto desse produto a OS já tem (0 se não tem). */
export function quantidadeNaOs(produtos: ProdutoUsado[], produtoId: string) {
  return produtos.find((produto) => produto.produtoId === produtoId)?.quantidade ?? 0;
}

/**
 * null se dá pra lançar; senão, o erro. `jaNaOs` é o que a OS já tem do mesmo
 * produto: a soma não pode passar do estoque.
 * TODO: o estoque só é conferido aqui; a baixa de verdade é do backend (ver o spec).
 */
export function validarQuantidade(quantidade: number, estoque: number, jaNaOs = 0): string | null {
  if (!Number.isInteger(quantidade) || quantidade < 1) return "Informe uma quantidade de pelo menos 1.";
  if (estoque <= 0) return "Produto sem estoque.";
  if (quantidade + jaNaOs > estoque) return `Só tem ${estoque} em estoque.`;
  return null;
}

/** Lança o produto na OS; se ele já está lá, soma na mesma linha (com o preço da primeira vez). */
export function adicionarProduto(
  produtos: ProdutoUsado[],
  produto: Pick<Produto, "id" | "nome" | "preco">,
  quantidade: number
): ProdutoUsado[] {
  if (produtos.some((usado) => usado.produtoId === produto.id)) {
    return produtos.map((usado) =>
      usado.produtoId === produto.id ? { ...usado, quantidade: usado.quantidade + quantidade } : usado
    );
  }
  return [...produtos, { produtoId: produto.id, nome: produto.nome, precoUnitario: produto.preco, quantidade }];
}

export function removerProduto(produtos: ProdutoUsado[], produtoId: string) {
  return produtos.filter((produto) => produto.produtoId !== produtoId);
}

/** null se o texto é um valor em reais (ou vazio = sem mão de obra); senão, o erro. */
export function validarMaoDeObra(texto: string): string | null {
  const limpo = texto.trim();
  if (limpo === "" || FORMATO_SIMPLES.test(limpo) || FORMATO_MILHAR.test(limpo)) return null;
  return "Informe um valor em reais, ex.: 150,00.";
}

/** "150,50" → 150.5; "1.500,00" → 1500; vazio ou inválido → null. */
export function paraValorEmReais(texto: string): number | null {
  const limpo = texto.trim();
  // com milhar, os pontos só separam os grupos: saem antes de a vírgula virar ponto
  if (FORMATO_MILHAR.test(limpo)) return Number(limpo.replace(/\./g, "").replace(",", "."));
  if (FORMATO_SIMPLES.test(limpo)) return Number(limpo.replace(",", "."));
  return null;
}

/** 150.5 → "150,50" (pro campo); null → "". */
export function maoDeObraParaTexto(valor: number | null) {
  return valor === null ? "" : valor.toFixed(2).replace(".", ",");
}

/** 1234.5 → "R$ 1.234,50". O Intl põe um espaço especial depois do R$; aqui vira espaço comum. */
export function formatarReais(valor: number) {
  return FORMATADOR_REAIS.format(valor).replace(/\s/g, " ");
}
