import { describe, expect, it } from "vitest";
import type { Produto } from "../../tipos/produto";
import type { LinhaCarrinho } from "../../contexto/useCarrinho";
import {
  adicionarUnidade,
  definirQuantidade,
  lerCarrinhoSalvo,
  quantidadeNoCarrinho,
  reconciliarComCatalogo,
} from "./regrasCarrinho";

function produto(dados: Partial<Produto> & Pick<Produto, "id">): Produto {
  return { categoria_id: "cat-a", codigo: "", nome: `Produto ${dados.id}`, preco: 10, estoque: 5, ativo: true, ...dados };
}

describe("adicionarUnidade", () => {
  it("soma 1 até o estoque e para no limite", () => {
    const p = produto({ id: "1", estoque: 2 });
    let itens: LinhaCarrinho[] = [];
    itens = adicionarUnidade(itens, p);
    expect(quantidadeNoCarrinho(itens, "1")).toBe(1);
    itens = adicionarUnidade(itens, p);
    expect(quantidadeNoCarrinho(itens, "1")).toBe(2);
    itens = adicionarUnidade(itens, p);
    expect(quantidadeNoCarrinho(itens, "1")).toBe(2);
  });

  it("não põe produto esgotado", () => {
    expect(adicionarUnidade([], produto({ id: "1", estoque: 0 }))).toEqual([]);
  });
});

describe("definirQuantidade", () => {
  it("abaixo de 1 remove o item", () => {
    const itens = [{ produto: produto({ id: "1" }), quantidade: 2 }];
    expect(definirQuantidade(itens, "1", 0)).toEqual([]);
  });

  it("não passa do estoque", () => {
    const itens = [{ produto: produto({ id: "1", estoque: 3 }), quantidade: 1 }];
    expect(quantidadeNoCarrinho(definirQuantidade(itens, "1", 7), "1")).toBe(3);
  });
});

describe("lerCarrinhoSalvo", () => {
  it("devolve [] pra null, JSON quebrado e formato errado", () => {
    expect(lerCarrinhoSalvo(null)).toEqual([]);
    expect(lerCarrinhoSalvo("{")).toEqual([]);
    expect(lerCarrinhoSalvo('{"a":1}')).toEqual([]);
  });

  it("descarta linhas inválidas e esgotadas e limita a quantidade ao estoque", () => {
    const valida = produto({ id: "3", estoque: 4 });
    const salvo = JSON.stringify([
      { produto: { nome: "Sem id", preco: 1, estoque: 3 }, quantidade: 1 },
      { produto: produto({ id: "2", estoque: 0 }), quantidade: 1 },
      { produto: valida, quantidade: 9 },
    ]);
    expect(lerCarrinhoSalvo(salvo)).toEqual([{ produto: valida, quantidade: 4 }]);
  });
});

describe("produto guardado no carrinho", () => {
  it("adicionarUnidade atualiza o produto guardado", () => {
    const antigo = produto({ id: "1", estoque: 2 });
    const novo = produto({ id: "1", estoque: 10 });
    const itens = adicionarUnidade([{ produto: antigo, quantidade: 2 }], novo);
    expect(itens).toEqual([{ produto: novo, quantidade: 3 }]);
  });

  it("definirQuantidade usa o produto novo quando recebe um", () => {
    const antigo = produto({ id: "1", estoque: 2 });
    const novo = produto({ id: "1", estoque: 10 });
    expect(definirQuantidade([{ produto: antigo, quantidade: 2 }], "1", 5, novo)).toEqual([{ produto: novo, quantidade: 5 }]);
  });
});

describe("reconciliarComCatalogo", () => {
  it("troca o produto guardado pelo da loja e avisa o preço novo", () => {
    const antigo = produto({ id: "1", nome: "Cloro", preco: 10 });
    const novo = produto({ id: "1", nome: "Cloro", preco: 12 });
    expect(reconciliarComCatalogo([{ produto: antigo, quantidade: 2 }], [novo])).toEqual({
      itens: [{ produto: novo, quantidade: 2 }],
      removidos: [],
      ajustados: ["Cloro"],
    });
  });

  it("tira o produto que saiu da loja (apagado ou inativo) e o esgotado", () => {
    const sumiu = produto({ id: "1", nome: "Escova" });
    const esgotado = produto({ id: "2", nome: "Peneira" });
    const resultado = reconciliarComCatalogo(
      [
        { produto: sumiu, quantidade: 1 },
        { produto: esgotado, quantidade: 1 },
      ],
      [produto({ id: "2", nome: "Peneira", estoque: 0 })]
    );
    expect(resultado.itens).toEqual([]);
    expect(resultado.removidos).toEqual(["Escova", "Peneira"]);
  });

  it("limita a quantidade ao estoque novo", () => {
    const resultado = reconciliarComCatalogo(
      [{ produto: produto({ id: "1", nome: "Cloro", estoque: 9 }), quantidade: 5 }],
      [produto({ id: "1", nome: "Cloro", estoque: 3 })]
    );
    expect(resultado.itens[0].quantidade).toBe(3);
    expect(resultado.ajustados).toEqual(["Cloro"]);
  });

  it("sem mudança na loja devolve sem ajustes", () => {
    const p = produto({ id: "1" });
    expect(reconciliarComCatalogo([{ produto: p, quantidade: 1 }], [p])).toEqual({
      itens: [{ produto: p, quantidade: 1 }],
      removidos: [],
      ajustados: [],
    });
  });
});
