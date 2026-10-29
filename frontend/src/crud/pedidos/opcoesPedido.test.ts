import { describe, expect, it } from "vitest";
import { codigoPedido, pedidoRecebido } from "./opcoesPedido";

describe("codigoPedido", () => {
  it("mostra os 8 primeiros caracteres em maiúsculo", () => {
    expect(codigoPedido("9e12fa07-aaaa")).toBe("9E12FA07");
  });
});

describe("pedidoRecebido", () => {
  it("é true pra PAGO, ENVIADO e ENTREGUE e false pra PENDENTE e CANCELADO", () => {
    expect(pedidoRecebido("PAGO")).toBe(true);
    expect(pedidoRecebido("ENVIADO")).toBe(true);
    expect(pedidoRecebido("ENTREGUE")).toBe(true);
    expect(pedidoRecebido("PENDENTE")).toBe(false);
    expect(pedidoRecebido("CANCELADO")).toBe(false);
  });
});
