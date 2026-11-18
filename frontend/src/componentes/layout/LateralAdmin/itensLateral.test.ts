import { describe, expect, it } from "vitest";
import { ITENS_LATERAL, itemAtivo } from "./itensLateral";

describe("itemAtivo", () => {
  it("/admin acende o Início", () => {
    expect(itemAtivo("/admin")).toBe("inicio");
    expect(itemAtivo("/admin/")).toBe("inicio");
  });

  it("cada área acende pelo começo do endereço", () => {
    expect(itemAtivo("/admin/pedidos")).toBe("pedidos");
    expect(itemAtivo("/admin/usuarios")).toBe("clientes");
    expect(itemAtivo("/admin/atendimentos/3f2a")).toBe("atendimentos");
  });

  it("o Início não acende nas outras áreas", () => {
    expect(itemAtivo("/admin/produtos")).not.toBe("inicio");
  });

  it("endereço fora das áreas não acende nada", () => {
    expect(itemAtivo("/admin/pedidosx")).toBeNull();
    expect(itemAtivo("/loja")).toBeNull();
  });
});

describe("ITENS_LATERAL", () => {
  it("sem Relatórios, que agora é o Início", () => {
    expect(ITENS_LATERAL.map((item) => item.id)).toEqual([
      "inicio",
      "atendimentos",
      "pedidos",
      "pagamentos",
      "produtos",
      "clientes",
    ]);
  });
});
