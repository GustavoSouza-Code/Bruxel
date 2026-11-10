import { describe, expect, it } from "vitest";
import type { Categoria } from "../../tipos/produto";
import { FILTROS_PRODUTO_INICIAIS } from "./filtrarProdutos";
import type { FiltrosProduto } from "./filtrarProdutos";
import {
  contarFiltrosLoja,
  filtrosAtivosLoja,
  limparFiltrosLoja,
  removerFiltroLoja,
  temFiltroLoja,
} from "./filtrosLoja";

const CATEGORIAS: Categoria[] = [
  { id: "cat-a", nome: "Limpeza da Piscina" },
  { id: "cat-b", nome: "Tratamento da água" },
];

function filtros(mudancas: Partial<FiltrosProduto>): FiltrosProduto {
  return { ...FILTROS_PRODUTO_INICIAIS, ...mudancas };
}

describe("contarFiltrosLoja e temFiltroLoja", () => {
  it("sem nada marcado não há filtro", () => {
    expect(contarFiltrosLoja(FILTROS_PRODUTO_INICIAIS)).toBe(0);
    expect(temFiltroLoja(FILTROS_PRODUTO_INICIAIS)).toBe(false);
  });

  it("a busca por nome não conta como filtro do painel", () => {
    expect(contarFiltrosLoja(filtros({ busca: "cloro" }))).toBe(0);
  });

  it("categoria, preço e ordem contam um cada", () => {
    expect(contarFiltrosLoja(filtros({ categoriaId: "cat-a" }))).toBe(1);
    expect(contarFiltrosLoja(filtros({ precoMin: "10", precoMax: "50" }))).toBe(1);
    expect(contarFiltrosLoja(filtros({ ordem: "preco-asc" }))).toBe(1);
    expect(contarFiltrosLoja(filtros({ categoriaId: "cat-a", precoMax: "50", ordem: "preco-desc" }))).toBe(3);
    expect(temFiltroLoja(filtros({ ordem: "preco-desc" }))).toBe(true);
  });

  it("texto que não é número não vale como filtro de preço", () => {
    expect(contarFiltrosLoja(filtros({ precoMin: "abc" }))).toBe(0);
  });
});

describe("filtrosAtivosLoja", () => {
  it("monta as etiquetas na ordem categoria, preço, ordenação", () => {
    const ativos = filtrosAtivosLoja(
      filtros({ categoriaId: "cat-b", precoMin: "10", precoMax: "45,9", ordem: "preco-asc" }),
      CATEGORIAS
    );
    expect(ativos).toEqual([
      { chave: "categoria", rotulo: "Tratamento da água" },
      { chave: "preco", rotulo: "R$ 10,00 a R$ 45,90" },
      { chave: "ordem", rotulo: "Menor preço" },
    ]);
  });

  it("descreve preço só com mínimo ou só com máximo", () => {
    expect(filtrosAtivosLoja(filtros({ precoMin: "20" }), CATEGORIAS)).toEqual([
      { chave: "preco", rotulo: "A partir de R$ 20,00" },
    ]);
    expect(filtrosAtivosLoja(filtros({ precoMax: "99.5" }), CATEGORIAS)).toEqual([
      { chave: "preco", rotulo: "Até R$ 99,50" },
    ]);
  });

  it("ignora categoria que não existe e não mostra a ordem padrão", () => {
    expect(filtrosAtivosLoja(filtros({ categoriaId: "sumiu" }), CATEGORIAS)).toEqual([]);
    expect(filtrosAtivosLoja(FILTROS_PRODUTO_INICIAIS, CATEGORIAS)).toEqual([]);
  });
});

describe("removerFiltroLoja e limparFiltrosLoja", () => {
  const todos = filtros({ busca: "cloro", categoriaId: "cat-a", precoMin: "10", precoMax: "50", ordem: "preco-desc" });

  it("remove só o grupo pedido", () => {
    expect(removerFiltroLoja(todos, "categoria")).toEqual({ ...todos, categoriaId: "" });
    expect(removerFiltroLoja(todos, "preco")).toEqual({ ...todos, precoMin: "", precoMax: "" });
    expect(removerFiltroLoja(todos, "ordem")).toEqual({ ...todos, ordem: "nome" });
  });

  it("limpar zera o painel e mantém a busca", () => {
    expect(limparFiltrosLoja(todos)).toEqual({ ...FILTROS_PRODUTO_INICIAIS, busca: "cloro" });
  });
});
