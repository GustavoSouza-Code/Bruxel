import { describe, expect, it } from "vitest";
import type { Produto } from "../../tipos/produto";
import type { LinhaCarrinho } from "../../contexto/useCarrinho";
import { adicionarUnidade, definirQuantidade, lerCarrinhoSalvo, quantidadeNoCarrinho } from "./regrasCarrinho";

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
