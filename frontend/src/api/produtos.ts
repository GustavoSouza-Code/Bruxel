import { requisicao } from "./cliente";
import type { Produto } from "../tipos/produto";

/** Produto como o backend devolve: preço vem em string (Decimal do Prisma) e textos opcionais vêm null. */
export type ProdutoApi = Omit<Produto, "preco" | "descricao" | "url_imagem"> & {
  preco: string | number;
  descricao?: string | null;
  url_imagem?: string | null;
  criado_em?: string;
  atualizado_em?: string;
};

/** O que o formulário entrega: o produto sem o id. */
export type DadosProduto = Omit<Produto, "id">;

/** Converte o produto da API pro formato do front (preço número, null vira undefined, sem datas). */
export function paraProduto(bruto: ProdutoApi): Produto {
  return {
    id: bruto.id,
    categoria_id: bruto.categoria_id,
    codigo: bruto.codigo,
    nome: bruto.nome,
    descricao: bruto.descricao ?? undefined,
    preco: Number(bruto.preco),
    estoque: bruto.estoque,
    url_imagem: bruto.url_imagem ?? undefined,
    ativo: bruto.ativo,
  };
}

// texto vazio vira null pra limpar o campo no banco
function textoOuNull(texto?: string) {
  const limpo = texto?.trim();
  return limpo ? limpo : null;
}

/**
 * Corpo do PUT /products/:id. O backend repassa o corpo cru pro Prisma, então
 * qualquer campo extra (id, datas) quebra a atualização: só vão os permitidos.
 */
export function paraCorpoProduto(dados: DadosProduto): Record<string, unknown> {
  return {
    categoria_id: dados.categoria_id,
    codigo: dados.codigo,
    nome: dados.nome,
    descricao: textoOuNull(dados.descricao),
    preco: dados.preco,
    estoque: dados.estoque,
    url_imagem: textoOuNull(dados.url_imagem),
    ativo: dados.ativo,
  };
}

/**
 * O backend lista sem ordem definida, então a vitrine (primeiros 4 ativos)
 * embaralharia a cada edição. Ordena por criação e desempata pelo código.
 */
export function ordenarProdutos(brutos: ProdutoApi[]): ProdutoApi[] {
  return [...brutos].sort(
    (a, b) => (a.criado_em ?? "").localeCompare(b.criado_em ?? "") || a.codigo.localeCompare(b.codigo)
  );
}

/** Lista os produtos (rota pública), em ordem estável. */
export async function listarProdutos(): Promise<Produto[]> {
  const brutos = await requisicao<ProdutoApi[]>("/products");
  return ordenarProdutos(brutos).map(paraProduto);
}

/**
 * Recado pro backend: o POST /products só guarda categoria_id, nome, codigo e
 * preco. Por isso criamos e em seguida fazemos um PUT com o resto (descricao,
 * estoque, url_imagem, ativo). Quando o POST aceitar tudo, dá pra tirar o PUT.
 */
export async function criarProduto(token: string, dados: DadosProduto): Promise<Produto> {
  const criado = await requisicao<ProdutoApi>("/products", {
    metodo: "POST",
    corpo: {
      categoria_id: dados.categoria_id,
      nome: dados.nome,
      codigo: dados.codigo,
      preco: dados.preco,
    },
    token,
  });
  return atualizarProduto(token, criado.id, dados);
}

/** Atualiza o produto e devolve o resultado já convertido. */
export async function atualizarProduto(token: string, id: string, dados: DadosProduto): Promise<Produto> {
  const atualizado = await requisicao<ProdutoApi>(`/products/${id}`, {
    metodo: "PUT",
    corpo: paraCorpoProduto(dados),
    token,
  });
  return paraProduto(atualizado);
}

/** Apaga o produto (o backend devolve o produto apagado, mas aqui não precisamos dele). */
export async function excluirProduto(token: string, id: string): Promise<void> {
  await requisicao<unknown>(`/products/${id}`, { metodo: "DELETE", token });
}
