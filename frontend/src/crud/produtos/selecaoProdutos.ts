import type { Categoria, Produto } from "../../tipos/produto";

const QUANTIDADE_VITRINE = 4;
const CATEGORIA_RECOMENDADOS = "Tratamento da água";

// compara nomes sem acento, sem maiúscula e sem espaço sobrando
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Só os produtos ativos (inativo não aparece na loja). */
export function apenasAtivos(produtos: Produto[]) {
  return produtos.filter((produto) => produto.ativo);
}

/** Os primeiros produtos da lista, pra vitrine "Produtos em destaque". */
export function produtosEmDestaque(produtos: Produto[]) {
  return produtos.slice(0, QUANTIDADE_VITRINE);
}

/** "Mais de {categoria}" na página do produto: outros da mesma categoria, sem ele mesmo. */
export function produtosRelacionados(produtos: Produto[], atual: Produto) {
  return produtos
    .filter((p) => p.categoria_id === atual.categoria_id && p.id !== atual.id)
    .slice(0, QUANTIDADE_VITRINE);
}

/** Quantas unidades ainda dá pra pôr no carrinho sem passar do estoque. */
export function quantidadeDisponivel(estoque: number, noCarrinho: number) {
  return Math.max(0, estoque - noCarrinho);
}

/**
 * Recomendados do carrinho: os primeiros da categoria "Tratamento da água".
 * Se a categoria não existir (ou estiver vazia), cai nos primeiros produtos.
 */
export function produtosRecomendados(produtos: Produto[], categorias: Categoria[]) {
  const alvo = normalizar(CATEGORIA_RECOMENDADOS);
  const categoria = categorias.find((c) => normalizar(c.nome) === alvo);
  const daCategoria = categoria ? produtos.filter((p) => p.categoria_id === categoria.id) : [];
  return (daCategoria.length > 0 ? daCategoria : produtos).slice(0, QUANTIDADE_VITRINE);
}
