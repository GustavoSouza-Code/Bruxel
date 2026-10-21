import { describe, expect, it } from "vitest";
import type { Categoria, Produto } from "../../tipos/produto";
import { apenasAtivos, produtosEmDestaque, produtosRecomendados } from "./selecaoProdutos";

function produto(dados: Partial<Produto> & Pick<Produto, "id">): Produto {
  return { categoria_id: "outra", codigo: "", nome: `Produto ${dados.id}`, preco: 10, estoque: 5, ativo: true, ...dados };
}

const ids = (lista: Produto[]) => lista.map((p) => p.id);

describe("apenasAtivos", () => {
  it("tira os inativos", () => {
    const lista = [produto({ id: "1" }), produto({ id: "2", ativo: false }), produto({ id: "3" })];
    expect(ids(apenasAtivos(lista))).toEqual(["1", "3"]);
  });
});

describe("produtosEmDestaque", () => {
  it("pega no máximo 4", () => {
    const seis = ["1", "2", "3", "4", "5", "6"].map((id) => produto({ id }));
    expect(ids(produtosEmDestaque(seis))).toEqual(["1", "2", "3", "4"]);
    expect(produtosEmDestaque(seis.slice(0, 2))).toHaveLength(2);
  });
});

describe("produtosRecomendados", () => {
  const lista = [
    produto({ id: "o1" }),
    produto({ id: "a1", categoria_id: "c1" }),
    produto({ id: "a2", categoria_id: "c1" }),
    produto({ id: "o2" }),
    produto({ id: "a3", categoria_id: "c1" }),
    produto({ id: "a4", categoria_id: "c1" }),
    produto({ id: "a5", categoria_id: "c1" }),
  ];

  it("usa Tratamento da água", () => {
    const categorias: Categoria[] = [{ id: "c1", nome: "Tratamento da água" }];
    expect(ids(produtosRecomendados(lista, categorias))).toEqual(["a1", "a2", "a3", "a4"]);
  });

  it("acha o nome sem acento/maiúscula", () => {
    const categorias: Categoria[] = [{ id: "c1", nome: "TRATAMENTO DA AGUA" }];
    expect(ids(produtosRecomendados(lista, categorias))).toEqual(["a1", "a2", "a3", "a4"]);
  });

  it("cai nos primeiros sem a categoria", () => {
    expect(ids(produtosRecomendados(lista, []))).toEqual(["o1", "a1", "a2", "o2"]);
  });
});
