import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "./atendimentoDeTeste";
import { STATUS_DA_ACAO, acoesDoStatus, osEditavel, validarMensagemCliente } from "./andamento";

describe("acoesDoStatus", () => {
  it("cada status mostra só as ações que valem pra ele", () => {
    expect(acoesDoStatus(atendimentoDeTeste({ status: "aguardando" }))).toEqual(["confirmar", "recusar"]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "agendado" }))).toEqual(["iniciar", "cancelar"]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "em-andamento" }))).toEqual(["concluir"]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "concluido" }))).toEqual(["marcar-pago"]);
  });

  it("pago, recusado e cancelado não têm mais ações", () => {
    expect(acoesDoStatus(atendimentoDeTeste({ status: "concluido", pagoEm: "2026-10-22T12:00:00.000Z" }))).toEqual([]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "recusado" }))).toEqual([]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "cancelado" }))).toEqual([]);
  });
});

describe("STATUS_DA_ACAO", () => {
  it("cada ação de andamento leva pro status que o backend espera", () => {
    expect(STATUS_DA_ACAO).toEqual({
      confirmar: "agendado",
      recusar: "recusado",
      iniciar: "em-andamento",
      cancelar: "cancelado",
      concluir: "concluido",
    });
  });
});

describe("OS", () => {
  it("só dá pra mexer em andamento ou concluída sem pagamento", () => {
    expect(osEditavel(atendimentoDeTeste({ status: "em-andamento" }))).toBe(true);
    expect(osEditavel(atendimentoDeTeste({ status: "concluido" }))).toBe(true);
    expect(osEditavel(atendimentoDeTeste({ status: "concluido", pagoEm: "2026-10-22T12:00:00.000Z" }))).toBe(false);
    expect(osEditavel(atendimentoDeTeste({ status: "agendado" }))).toBe(false);
  });
});

describe("validarMensagemCliente", () => {
  it("pede pelo menos 10 caracteres, sem contar os espaços das pontas", () => {
    const erro = "Escreva a mensagem pro cliente (pelo menos 10 caracteres).";
    expect(validarMensagemCliente("")).toBe(erro);
    expect(validarMensagemCliente("   curta   ")).toBe(erro);
    expect(validarMensagemCliente("123456789")).toBe(erro);
    expect(validarMensagemCliente("1234567890")).toBeNull();
  });
});
