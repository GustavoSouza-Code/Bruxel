import { describe, expect, it } from "vitest";
import { codigoAtendimento, totalVisivelParaCliente } from "./opcoesAtendimento";

describe("codigoAtendimento", () => {
  it("mostra os 8 primeiros caracteres do UUID em maiúsculo", () => {
    expect(codigoAtendimento("3f2a9c1b-0000-4000-8000-000000000001")).toBe("3F2A9C1B");
  });
});

describe("totalVisivelParaCliente", () => {
  it("só em andamento ou concluída, com total", () => {
    expect(totalVisivelParaCliente({ status: "concluido", valorTotal: 120 })).toBe(true);
    expect(totalVisivelParaCliente({ status: "em-andamento", valorTotal: 0 })).toBe(true);
    expect(totalVisivelParaCliente({ status: "aguardando", valorTotal: 0 })).toBe(false);
    expect(totalVisivelParaCliente({ status: "cancelado", valorTotal: 0 })).toBe(false);
    expect(totalVisivelParaCliente({ status: "concluido", valorTotal: null })).toBe(false);
  });
});
