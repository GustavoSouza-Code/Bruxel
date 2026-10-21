import { describe, expect, it } from "vitest";
import { ordenarProdutos, paraCorpoProduto, paraProduto, type DadosProduto, type ProdutoApi } from "./produtos";

const base: ProdutoApi = {
  id: "p1",
  categoria_id: "c1",
  codigo: "HF-1L",
  nome: "Hidrofloc 1L",
  preco: 10,
  estoque: 5,
  ativo: true,
};

const dados: DadosProduto = {
  categoria_id: "c1",
  codigo: "HF-1L",
  nome: "Hidrofloc 1L",
  descricao: "texto",
  preco: 10,
  estoque: 5,
  url_imagem: "http://x/y.png",
  ativo: true,
};

describe("paraProduto", () => {
  it("converte preço em string pra número", () => {
    expect(paraProduto({ ...base, preco: "21.5" }).preco).toBe(21.5);
  });

  it("mantém preço numérico", () => {
    expect(paraProduto({ ...base, preco: 395 }).preco).toBe(395);
  });

  it("troca null por undefined e descarta datas", () => {
    const r = paraProduto({ ...base, descricao: null, url_imagem: null, criado_em: "2026-01-01" });
    expect(r.descricao).toBeUndefined();
    expect(r.url_imagem).toBeUndefined();
    expect("criado_em" in r).toBe(false);
  });
});

describe("paraCorpoProduto", () => {
  it("só leva os campos aceitos", () => {
    const entrada = { ...dados, id: "x", criado_em: "2026" } as unknown as DadosProduto;
    expect(Object.keys(paraCorpoProduto(entrada)).sort()).toEqual([
      "ativo",
      "categoria_id",
      "codigo",
      "descricao",
      "estoque",
      "nome",
      "preco",
      "url_imagem",
    ]);
  });

  it("manda null em texto vazio", () => {
    const corpo = paraCorpoProduto({ ...dados, descricao: "", url_imagem: "  " });
    expect(corpo.descricao).toBeNull();
    expect(corpo.url_imagem).toBeNull();
  });

  it("não manda o estoque quando ele não mudou", () => {
    expect("estoque" in paraCorpoProduto(dados, 5)).toBe(false);
  });

  it("manda o estoque quando ele mudou", () => {
    expect(paraCorpoProduto(dados, 3).estoque).toBe(5);
  });

  it("manda o estoque quando não sabe o anterior", () => {
    expect(paraCorpoProduto(dados).estoque).toBe(5);
  });
});

describe("ordenarProdutos", () => {
  it("ordena por criado_em crescente", () => {
    const lista = [
      { ...base, id: "b", codigo: "B", criado_em: "2026-02-01T00:00:00Z" },
      { ...base, id: "a", codigo: "A", criado_em: "2026-01-01T00:00:00Z" },
    ];
    expect(ordenarProdutos(lista).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("desempata pelo código quando o criado_em é igual", () => {
    const quando = "2026-01-01T00:00:00Z";
    const lista = [
      { ...base, id: "2", codigo: "Z-2", criado_em: quando },
      { ...base, id: "1", codigo: "A-1", criado_em: quando },
    ];
    expect(ordenarProdutos(lista).map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("não altera a lista original", () => {
    const lista = [
      { ...base, id: "b", criado_em: "2026-02-01T00:00:00Z" },
      { ...base, id: "a", criado_em: "2026-01-01T00:00:00Z" },
    ];
    ordenarProdutos(lista);
    expect(lista[0].id).toBe("b");
  });
});
