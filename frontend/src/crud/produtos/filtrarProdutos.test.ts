import { describe, expect, it } from "vitest";
import type { Produto } from "../../tipos/produto";
import {
  FILTROS_PRODUTO_INICIAIS,
  contarFiltrosAtivosProduto,
  filtrarProdutos,
} from "./filtrarProdutos";
import type { FiltrosProduto } from "./filtrarProdutos";

function produto(dados: Partial<Produto> & Pick<Produto, "id" | "nome">): Produto {
  return { categoria_id: "cat-a", codigo: "", preco: 10, estoque: 5, ativo: true, ...dados };
}

const PRODUTOS: Produto[] = [
  produto({ id: "1", nome: "Válvula seletora", codigo: "VS-100", categoria_id: "cat-a", preco: 120, estoque: 2 }),
  produto({ id: "2", nome: "Cloro granulado", codigo: "CL-10", categoria_id: "cat-b", preco: 45.9, estoque: 30 }),
  produto({ id: "3", nome: "Aspirador", codigo: "AS-1", categoria_id: "cat-a", preco: 80, estoque: 0, ativo: false }),
];

function filtros(mudancas: Partial<FiltrosProduto>): FiltrosProduto {
  return { ...FILTROS_PRODUTO_INICIAIS, ...mudancas };
}

const ids = (lista: Produto[]) => lista.map((p) => p.id);

describe("filtrarProdutos", () => {
  it("sem filtros devolve todos, em ordem alfabética", () => {
    expect(ids(filtrarProdutos(PRODUTOS, FILTROS_PRODUTO_INICIAIS))).toEqual(["3", "2", "1"]);
  });

  it("busca pelo nome sem ligar pra acento", () => {
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ busca: "valvula" })))).toEqual(["1"]);
  });

  it("busca também pelo código", () => {
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ busca: "cl-10" })))).toEqual(["2"]);
  });

  it("filtra pela categoria", () => {
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ categoriaId: "cat-a" })))).toEqual(["3", "1"]);
  });

  it("filtra por ativos e por inativos", () => {
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ status: "ativo" })))).toEqual(["2", "1"]);
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ status: "inativo" })))).toEqual(["3"]);
  });

  it("filtra pela faixa de preço, incluindo os limites", () => {
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ precoMin: "80", precoMax: "120" })))).toEqual([
      "3",
      "1",
    ]);
  });

  it("ignora preço que não é número", () => {
    expect(filtrarProdutos(PRODUTOS, filtros({ precoMin: "abc" }))).toHaveLength(3);
  });

  it("combina os filtros", () => {
    expect(
      ids(filtrarProdutos(PRODUTOS, filtros({ categoriaId: "cat-a", status: "ativo" })))
    ).toEqual(["1"]);
  });

  it("ordena por preço e por estoque", () => {
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ ordem: "preco-asc" })))).toEqual(["2", "3", "1"]);
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ ordem: "preco-desc" })))).toEqual(["1", "3", "2"]);
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ ordem: "estoque-asc" })))).toEqual(["3", "1", "2"]);
  });

  it("não altera a lista original", () => {
    const copia = [...PRODUTOS];
    filtrarProdutos(PRODUTOS, filtros({ ordem: "preco-desc" }));
    expect(PRODUTOS).toEqual(copia);
  });
});

describe("contarFiltrosAtivosProduto", () => {
  it("é zero sem filtros, e não conta busca nem categoria (que já aparecem na tela)", () => {
    expect(contarFiltrosAtivosProduto(filtros({ busca: "x", categoriaId: "cat-a" }))).toBe(0);
  });

  it("conta status, preço mínimo, preço máximo e ordem diferente da padrão", () => {
    expect(
      contarFiltrosAtivosProduto(
        filtros({ status: "ativo", precoMin: "1", precoMax: "9", ordem: "preco-asc" })
      )
    ).toBe(4);
  });
});

describe("filtro de estoque", () => {
  it("estoque baixo inclui os esgotados", () => {
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ estoque: "baixo" })))).toEqual(["3", "1"]);
  });

  it("esgotado mostra só estoque 0", () => {
    expect(ids(filtrarProdutos(PRODUTOS, filtros({ estoque: "esgotado" })))).toEqual(["3"]);
  });

  it("estoque conta como filtro ativo", () => {
    expect(contarFiltrosAtivosProduto(filtros({ estoque: "baixo" }))).toBe(1);
  });
});
