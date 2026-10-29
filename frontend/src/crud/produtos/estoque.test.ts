import { describe, expect, it } from "vitest";
import type { Produto } from "../../tipos/produto";
import { contarEstoque, situacaoEstoque } from "./estoque";

function produto(dados: Partial<Produto> & Pick<Produto, "id">): Produto {
  return { categoria_id: "c", codigo: "", nome: `Produto ${dados.id}`, preco: 10, estoque: 5, ativo: true, ...dados };
}

describe("situacaoEstoque", () => {
  it("0 ou menos é esgotado, até 3 é baixo, acima é ok", () => {
    expect(situacaoEstoque(0)).toBe("esgotado");
    expect(situacaoEstoque(-1)).toBe("esgotado");
    expect(situacaoEstoque(1)).toBe("baixo");
    expect(situacaoEstoque(3)).toBe("baixo");
    expect(situacaoEstoque(4)).toBe("ok");
  });
});

describe("contarEstoque", () => {
  it("conta só ativos e baixo inclui esgotados", () => {
    const lista = [
      produto({ id: "1", estoque: 0 }),
      produto({ id: "2", estoque: 2 }),
      produto({ id: "3", estoque: 10 }),
      produto({ id: "4", estoque: 0, ativo: false }),
    ];
    expect(contarEstoque(lista)).toEqual({ baixo: 2, esgotados: 1 });
  });
});
