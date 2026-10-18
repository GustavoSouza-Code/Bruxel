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
