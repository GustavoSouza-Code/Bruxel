import { describe, expect, it } from "vitest";
import { codigoPedido, pedidoRecebido, podeCancelar, proximoPasso } from "./opcoesPedido";

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

describe("proximoPasso", () => {
  it("PAGO vai pra ENVIADO e ENVIADO vai pra ENTREGUE", () => {
    expect(proximoPasso("PAGO")).toMatchObject({ status: "ENVIADO", rotulo: "Marcar como enviado" });
    expect(proximoPasso("ENVIADO")).toMatchObject({ status: "ENTREGUE", rotulo: "Marcar como entregue" });
  });

  it("não tem próximo passo em PENDENTE, ENTREGUE e CANCELADO", () => {
    expect(proximoPasso("PENDENTE")).toBeNull();
    expect(proximoPasso("ENTREGUE")).toBeNull();
    expect(proximoPasso("CANCELADO")).toBeNull();
  });
});

describe("podeCancelar", () => {
  it("é true até ENVIADO e false depois", () => {
    expect(podeCancelar("PENDENTE")).toBe(true);
    expect(podeCancelar("PAGO")).toBe(true);
    expect(podeCancelar("ENVIADO")).toBe(true);
    expect(podeCancelar("ENTREGUE")).toBe(false);
    expect(podeCancelar("CANCELADO")).toBe(false);
  });
});
