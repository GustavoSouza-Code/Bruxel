import type { Categoria, Produto } from "../../tipos/produto";
import { apenasAtivos, normalizar, produtosRecomendados } from "./selecaoProdutos";

const QUANTIDADE_RECOMENDADOS = 4;

/**
 * Palavras procuradas no nome e na descrição dos produtos, uma lista por
 * pergunta do Piscinator, na mesma ordem: água verde, água turva, vários dias
 * sem manutenção. Os produtos são cadastrados pelo admin, então o nome exato
 * não é garantido; por isso a busca é por palavra.
 */
export const TERMOS_POR_PERGUNTA: string[][] = [
  ["algicida", "choque", "cloro"],
  ["clarificante", "floculante", "floc", "decantador"],
  ["escova", "peneira", "aspirador", "3 em 1"],
];

/** Sem nenhum "Sim": produtos de manutenção do dia a dia. */
export const TERMOS_SEM_PROBLEMA = ["manutencao", "3 em 1", "ph"];

// "Propool 3em1" tem que casar com "3 em 1": compara também sem os espaços
function casa(produto: Produto, termos: string[]) {
  const texto = normalizar(`${produto.nome} ${produto.descricao ?? ""}`);
  const textoJunto = texto.replace(/\s+/g, "");
  return termos.some((termo) => {
    const alvo = normalizar(termo);
    return texto.includes(alvo) || textoJunto.includes(alvo.replace(/\s+/g, ""));
  });
}

/**
 * Até 4 produtos pro resultado do Piscinator, conforme as respostas (true =
 * "Sim"): primeiro os que casam com cada "Sim", na ordem das perguntas; depois
 * completa com a categoria "Tratamento da água" e, por fim, com qualquer
 * produto ativo. Sem repetir, e com estoque antes dos esgotados.
 */
export function recomendarPorDiagnostico(respostas: boolean[], produtos: Produto[], categorias: Categoria[]): Produto[] {
  const ativos = apenasAtivos(produtos);
  const comEstoque = ativos.filter((produto) => produto.estoque > 0);

  const sims = respostas.flatMap((sim, indice) => (sim ? [TERMOS_POR_PERGUNTA[indice] ?? []] : []));
  const grupos = sims.length > 0 ? sims : [TERMOS_SEM_PROBLEMA];
  const candidatos = grupos.flatMap((termos) => ativos.filter((produto) => casa(produto, termos)));

  // a reserva da categoria recebe só os com estoque: senão um esgotado tomaria a vaga de outro
  const emOrdem = [...candidatos, ...produtosRecomendados(comEstoque, categorias), ...ativos];
  const unicos = emOrdem.filter((produto, indice) => emOrdem.findIndex((p) => p.id === produto.id) === indice);

  return [...unicos.filter((p) => p.estoque > 0), ...unicos.filter((p) => p.estoque <= 0)].slice(
    0,
    QUANTIDADE_RECOMENDADOS
  );
}
