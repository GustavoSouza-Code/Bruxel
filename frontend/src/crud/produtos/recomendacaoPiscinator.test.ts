import { describe, expect, it } from "vitest";
import type { Categoria, Produto } from "../../tipos/produto";
import { PERGUNTAS, recomendarComMotivos, recomendarPorDiagnostico } from "./recomendacaoPiscinator";

function produto(dados: Partial<Produto> & Pick<Produto, "id" | "nome">): Produto {
  return { categoria_id: "trat", codigo: "", preco: 10, estoque: 5, ativo: true, ...dados };
}

const CATEGORIAS: Categoria[] = [
  { id: "trat", nome: "Tratamento da água" },
  { id: "limp", nome: "Limpeza da Piscina" },
  { id: "lazer", nome: "Acessórios & Lazer" },
];

const CATALOGO: Produto[] = [
  produto({ id: "cadeira", nome: "Cadeira de praia", categoria_id: "lazer" }),
  produto({ id: "esgotado", nome: "Cloro granulado", estoque: 0 }),
  produto({ id: "alg", nome: "Algicida Choque 1L" }),
  produto({ id: "floc", nome: "Hidrofloc 1L", descricao: "Clarificante para água turva" }),
  produto({ id: "escova", nome: "Escova de parede", categoria_id: "limp" }),
  produto({ id: "tresem1", nome: "Propool 3em1 10kg" }),
  produto({ id: "ph", nome: "pH+ 2kg" }),
  produto({ id: "inativo", nome: "Algicida antigo", ativo: false }),
];

const ids = (lista: Produto[]) => lista.map((p) => p.id);

// respostas com Sim só nas perguntas indicadas (índice a partir de 0), as demais Não
const sim = (...indices: number[]) => PERGUNTAS.map((_, i) => indices.includes(i));

describe("recomendarPorDiagnostico", () => {
  it("água verde recomenda algicida e cloro primeiro", () => {
    expect(ids(recomendarPorDiagnostico([true, false, false], CATALOGO, CATEGORIAS))[0]).toBe("alg");
  });

  it("água turva recomenda floculante", () => {
    expect(ids(recomendarPorDiagnostico([false, true, false], CATALOGO, CATEGORIAS))[0]).toBe("floc");
  });

  it("sem nenhum Sim recomenda manutenção", () => {
    const lista = ids(recomendarPorDiagnostico([false, false, false], CATALOGO, CATEGORIAS));
    expect(lista.slice(0, 2)).toEqual(["tresem1", "ph"]);
  });

  it('3em1 sem espaço casa com "3 em 1"', () => {
    expect(ids(recomendarPorDiagnostico([false, false, true], CATALOGO, CATEGORIAS))).toContain("tresem1");
  });

  it("não repete produto que casa com duas respostas", () => {
    const lista = ids(recomendarPorDiagnostico([true, true, true], CATALOGO, CATEGORIAS));
    expect(new Set(lista).size).toBe(lista.length);
  });

  it("ignora inativos e deixa esgotados por último", () => {
    const lista = ids(recomendarPorDiagnostico([true, false, false], CATALOGO, CATEGORIAS));
    expect(lista).not.toContain("inativo");
    expect(lista).not.toContain("esgotado"); // há 4 com estoque antes dele
    const soEsgotado = [produto({ id: "esgotado", nome: "Cloro granulado", estoque: 0 }), produto({ id: "alg", nome: "Algicida" })];
    expect(ids(recomendarPorDiagnostico([true, false, false], soEsgotado, CATEGORIAS))).toEqual(["alg", "esgotado"]);
  });

  it("completa com a categoria Tratamento da água e depois com qualquer ativo, até 4", () => {
    expect(ids(recomendarPorDiagnostico([false, true, false], CATALOGO, CATEGORIAS))).toEqual(["floc", "alg", "tresem1", "ph"]);
    expect(recomendarPorDiagnostico([false, true, false], CATALOGO, [])).toHaveLength(4);
  });

  it("catálogo vazio devolve lista vazia", () => {
    expect(recomendarPorDiagnostico([true, false, false], [], CATEGORIAS)).toEqual([]);
  });
});

describe("perguntas do Piscinator", () => {
  it("são 8, cada uma com texto, rótulo e termos", () => {
    expect(PERGUNTAS).toHaveLength(8);
    for (const pergunta of PERGUNTAS) {
      expect(pergunta.texto.endsWith("?")).toBe(true);
      expect(pergunta.rotulo).not.toBe("");
      expect(pergunta.termos.length).toBeGreaterThan(0);
    }
  });
});

describe("recomendarComMotivos (pontuação)", () => {
  const CATALOGO_NOVO: Produto[] = [
    produto({ id: "floc", nome: "Hidrofloc 1L", descricao: "Clarificante" }),
    produto({ id: "alg", nome: "Algicida Choque 1L" }),
    produto({ id: "areia", nome: "Areia para filtro 25kg", categoria_id: "limp" }),
    produto({ id: "peneira", nome: "Peneira de folhas", categoria_id: "limp" }),
    produto({ id: "redutor", nome: "Redutor de pH 1L" }),
    produto({ id: "cadeira", nome: "Cadeira de praia", categoria_id: "lazer" }),
  ];

  it("produto que casa com mais Sim sobe, mesmo vindo depois no catálogo", () => {
    // verde (0) e chuva/uso (7) apontam os dois pro algicida; o floculante só casa com turva
    const lista = recomendarComMotivos(sim(0, 1, 7), CATALOGO_NOVO, CATEGORIAS);
    expect(lista[0].produto.id).toBe("alg");
    expect(lista[0].motivos).toEqual(["piscinas verdes", "depois de chuva ou muito uso"]);
    expect(lista[1].produto.id).toBe("floc");
    expect(lista[1].motivos).toEqual(["água turva"]);
  });

  it("empate mantém a ordem do catálogo", () => {
    const lista = recomendarComMotivos(sim(1, 0), CATALOGO_NOVO, CATEGORIAS);
    expect(ids(lista.map((r) => r.produto)).slice(0, 2)).toEqual(["floc", "alg"]);
  });

  it("filtro ou bomba fracos recomenda produtos de filtração", () => {
    expect(ids(recomendarPorDiagnostico(sim(6), CATALOGO_NOVO, CATEGORIAS))[0]).toBe("areia");
  });

  it("sujeira no fundo recomenda peneira", () => {
    expect(ids(recomendarPorDiagnostico(sim(5), CATALOGO_NOVO, CATEGORIAS))[0]).toBe("peneira");
  });

  it("olhos ardendo ou cheiro forte recomenda correção de pH", () => {
    expect(ids(recomendarPorDiagnostico(sim(4), CATALOGO_NOVO, CATEGORIAS))[0]).toBe("redutor");
  });

  it("paredes escorregadias recomenda algicida", () => {
    expect(ids(recomendarPorDiagnostico(sim(3), CATALOGO_NOVO, CATEGORIAS))[0]).toBe("alg");
  });

  it("produto de preenchimento (não casa com nenhum Sim) vem sem motivos", () => {
    const lista = recomendarComMotivos(sim(1), CATALOGO_NOVO, CATEGORIAS);
    expect(lista).toHaveLength(4);
    const cadeira = recomendarComMotivos(sim(1), CATALOGO_NOVO, [])
      .find((r) => r.produto.id === "cadeira");
    expect(cadeira?.motivos ?? []).toEqual([]);
  });

  it("sem nenhum Sim não mostra motivos", () => {
    const lista = recomendarComMotivos(sim(), CATALOGO, CATEGORIAS);
    expect(lista.every((r) => r.motivos.length === 0)).toBe(true);
  });

  it("aceita respostas curtas (só as 3 primeiras)", () => {
    expect(recomendarComMotivos([true], CATALOGO, CATEGORIAS)).toHaveLength(4);
  });
});
