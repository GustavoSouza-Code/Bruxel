import { describe, expect, it } from "vitest";
import { paraCorpoPedido, paraPedido, type PedidoApi } from "./pedidos";

const bruto: PedidoApi = {
  id: "o1",
  usuario_id: "u1",
  status: "PENDENTE",
  forma_pagamento: "PIX",
  endereco_entrega: "Rua X, 850 - Centro - Lajeado - RS",
  valor_frete: "0",
  valor_total: "43.00",
  criado_em: "2026-10-26T13:00:00.000Z",
  atualizado_em: "2026-10-26T13:00:00.000Z",
  order_items: [
    {
      id: "i1",
      pedido_id: "o1",
      produto_id: "p1",
      quantidade: 2,
      preco_unitario: "21.50",
      products: { nome: "Hidrofloc 1L" },
    },
  ],
};

describe("paraPedido", () => {
  it("converte os decimais em string pra número", () => {
    const pedido = paraPedido(bruto);
    expect(pedido.valorTotal).toBe(43);
    expect(pedido.valorFrete).toBe(0);
    expect(pedido.itens[0].precoUnitario).toBe(21.5);
  });

  it("traz o nome do produto de cada item", () => {
    expect(paraPedido(bruto).itens).toEqual([
      { produtoId: "p1", nome: "Hidrofloc 1L", quantidade: 2, precoUnitario: 21.5 },
    ]);
  });

  it("mantém status, forma de pagamento, endereço e data", () => {
    const pedido = paraPedido(bruto);
    expect(pedido.status).toBe("PENDENTE");
    expect(pedido.formaPagamento).toBe("PIX");
    expect(pedido.enderecoEntrega).toBe("Rua X, 850 - Centro - Lajeado - RS");
    expect(pedido.criadoEm).toBe("2026-10-26T13:00:00.000Z");
  });

  it("aceita pedido sem itens na resposta", () => {
    expect(paraPedido({ ...bruto, order_items: undefined }).itens).toEqual([]);
  });
});

describe("paraCorpoPedido", () => {
  it("manda só id e quantidade de cada linha, com o endereço sem espaços nas pontas", () => {
    const corpo = paraCorpoPedido(
      [
        { produto: { id: "p1" }, quantidade: 2 },
        { produto: { id: "p2" }, quantidade: 1 },
      ],
      "BOLETO",
      "  Rua X, 850  "
    );
    expect(corpo).toEqual({
      itens: [
        { produto_id: "p1", quantidade: 2 },
        { produto_id: "p2", quantidade: 1 },
      ],
      forma_pagamento: "BOLETO",
      endereco_entrega: "Rua X, 850",
    });
  });
});
