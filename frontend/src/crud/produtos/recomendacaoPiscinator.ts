import type { Categoria, Produto } from "../../tipos/produto";
import { apenasAtivos, normalizar, produtosRecomendados } from "./selecaoProdutos";

const QUANTIDADE_RECOMENDADOS = 4;

/**
 * Uma pergunta do Piscinator: o texto que aparece no questionário, o rótulo
 * usado em "Indicado porque você respondeu Sim para: ..." e as palavras
 * procuradas no nome e na descrição dos produtos. Os produtos são cadastrados
 * pelo admin, então o nome exato não é garantido; por isso a busca é por palavra.
 * A ordem da lista é a ordem das perguntas (e das respostas).
 */
export interface PerguntaPiscinator {
  texto: string;
  rotulo: string;
  termos: string[];
}

export const PERGUNTAS: PerguntaPiscinator[] = [
  { texto: "A água da piscina está verde?", rotulo: "água verde", termos: ["algicida", "choque", "cloro"] },
  { texto: "A água está turva?", rotulo: "água turva", termos: ["clarificante", "floculante", "floc", "decantador"] },
  {
    texto: "A piscina ficou vários dias sem manutenção?",
    rotulo: "vários dias sem manutenção",
    termos: ["escova", "peneira", "aspirador", "3 em 1"],
  },
  {
    texto: "As paredes ou o fundo estão escorregadios ou com manchas?",
    rotulo: "paredes escorregadias ou manchadas",
    termos: ["algicida", "alga", "escova", "cloro"],
  },
  {
    texto: "Os olhos ou a pele ardem, ou o cheiro de cloro está muito forte?",
    rotulo: "olhos ardendo ou cheiro forte de cloro",
    termos: ["ph", "redutor", "elevador", "equilibrio"],
  },
  {
    texto: "Tem folhas e sujeira no fundo ou boiando?",
    rotulo: "folhas e sujeira",
    termos: ["peneira", "aspirador", "escova", "3 em 1"],
  },
  {
    texto: "O filtro ou a bomba parecem fracos, com pouca circulação?",
    rotulo: "filtro ou bomba fracos",
    termos: ["filtro", "bomba", "areia", "cartucho", "refil"],
  },
  {
    texto: "Choveu muito ou a piscina teve muito uso nos últimos dias?",
    rotulo: "chuva ou muito uso",
    termos: ["cloro", "choque", "algicida"],
  },
];

/** Sem nenhum "Sim": produtos de manutenção do dia a dia. */
export const TERMOS_SEM_PROBLEMA = ["manutencao", "3 em 1", "ph"];

/** Um produto recomendado e os rótulos dos "Sim" que o fizeram pontuar (vazio = só preenche a vaga). */
export interface Recomendacao {
  produto: Produto;
  motivos: string[];
}

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
 * "Sim"). Cada "Sim" dá 1 ponto aos produtos que casam com as palavras da
 * pergunta; ganham os de maior pontuação (empate: ordem do catálogo). Depois
 * completa com a categoria "Tratamento da água" e, por fim, com qualquer
 * produto ativo. Sem repetir, e com estoque antes dos esgotados.
 * Sem nenhum "Sim", os candidatos são os produtos de manutenção do dia a dia.
 */
export function recomendarComMotivos(respostas: boolean[], produtos: Produto[], categorias: Categoria[]): Recomendacao[] {
  const ativos = apenasAtivos(produtos);
  const comEstoque = ativos.filter((produto) => produto.estoque > 0);

  const sims = respostas.flatMap((sim, indice) => (sim && PERGUNTAS[indice] ? [PERGUNTAS[indice]] : []));
  const grupos = sims.length > 0 ? sims : [{ rotulo: "", termos: TERMOS_SEM_PROBLEMA }];

  const pontuados = ativos
    .map((produto) => ({
      produto,
      motivos: grupos.filter((grupo) => casa(produto, grupo.termos)).map((grupo) => grupo.rotulo),
    }))
    .filter((item) => item.motivos.length > 0)
    // o sort é estável: quem empata mantém a ordem do catálogo
    .sort((a, b) => b.motivos.length - a.motivos.length);

  const candidatos: Recomendacao[] = pontuados.map((item) => ({
    produto: item.produto,
    // sem nenhum "Sim" o rótulo é "" e não vira motivo
    motivos: item.motivos.filter(Boolean),
  }));
  // a reserva da categoria recebe só os com estoque: senão um esgotado tomaria a vaga de outro
  const reserva = [...produtosRecomendados(comEstoque, categorias), ...ativos].map((produto) => ({
    produto,
    motivos: [] as string[],
  }));

  const emOrdem = [...candidatos, ...reserva];
  const unicos = emOrdem.filter((item, indice) => emOrdem.findIndex((o) => o.produto.id === item.produto.id) === indice);

  return [...unicos.filter((i) => i.produto.estoque > 0), ...unicos.filter((i) => i.produto.estoque <= 0)].slice(
    0,
    QUANTIDADE_RECOMENDADOS
  );
}

/** Só os produtos de recomendarComMotivos, pra quem não precisa dos motivos. */
export function recomendarPorDiagnostico(respostas: boolean[], produtos: Produto[], categorias: Categoria[]): Produto[] {
  return recomendarComMotivos(respostas, produtos, categorias).map((item) => item.produto);
}
