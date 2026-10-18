import { describe, expect, it } from "vitest";
import { paraCorpoProduto, paraProduto, type DadosProduto, type ProdutoApi } from "./produtos";

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
});
