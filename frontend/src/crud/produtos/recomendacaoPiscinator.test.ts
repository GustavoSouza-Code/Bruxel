import { describe, expect, it } from "vitest";
import type { Categoria, Produto } from "../../tipos/produto";
import { recomendarPorDiagnostico } from "./recomendacaoPiscinator";

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
