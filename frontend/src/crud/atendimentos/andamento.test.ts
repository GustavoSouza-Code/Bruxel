import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "./atendimentoDeTeste";
import {
  acoesDoStatus,
  atualizarOs,
  cancelar,
  concluir,
  confirmar,
  iniciar,
  marcarPago,
  osEditavel,
  recusar,
  validarMensagemCliente,
} from "./andamento";

const MENSAGEM = "Não atendemos o seu bairro nesse dia.";

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

describe("transições", () => {
  it("confirmar, iniciar e concluir andam um passo e não mexem no original", () => {
    const original = atendimentoDeTeste();
    const agendado = confirmar(original);
    expect(agendado.status).toBe("agendado");
    expect(original.status).toBe("aguardando");
    expect(iniciar(agendado).status).toBe("em-andamento");
    expect(concluir(iniciar(agendado)).status).toBe("concluido");
  });

  it("recusar e cancelar guardam a mensagem sem espaços nas pontas", () => {
    const recusado = recusar(atendimentoDeTeste(), `  ${MENSAGEM}  `);
    expect(recusado.status).toBe("recusado");
    expect(recusado.mensagemCliente).toBe(MENSAGEM);
    const cancelado = cancelar(atendimentoDeTeste({ status: "agendado" }), MENSAGEM);
    expect(cancelado.status).toBe("cancelado");
    expect(cancelado.mensagemCliente).toBe(MENSAGEM);
  });

  it("recusar sem uma mensagem de verdade é bug: lança erro", () => {
    expect(() => recusar(atendimentoDeTeste(), "          ")).toThrow();
    expect(() => cancelar(atendimentoDeTeste({ status: "agendado" }), "curta")).toThrow();
  });

  it("ação fora de hora é bug: lança erro", () => {
    expect(() => confirmar(atendimentoDeTeste({ status: "agendado" }))).toThrow();
    expect(() => iniciar(atendimentoDeTeste())).toThrow();
    expect(() => recusar(atendimentoDeTeste({ status: "em-andamento" }), MENSAGEM)).toThrow();
  });

  it("marcar como pago guarda a hora e só vale uma vez, depois de concluído", () => {
    const agora = new Date("2026-10-22T12:00:00.000Z");
    const pago = marcarPago(atendimentoDeTeste({ status: "concluido" }), agora);
    expect(pago.pagoEm).toBe("2026-10-22T12:00:00.000Z");
    expect(() => marcarPago(pago, agora)).toThrow();
    expect(() => marcarPago(atendimentoDeTeste({ status: "em-andamento" }), agora)).toThrow();
  });
});

describe("OS", () => {
  it("só dá pra mexer em andamento ou concluída sem pagamento", () => {
    expect(osEditavel(atendimentoDeTeste({ status: "em-andamento" }))).toBe(true);
    expect(osEditavel(atendimentoDeTeste({ status: "concluido" }))).toBe(true);
    expect(osEditavel(atendimentoDeTeste({ status: "concluido", pagoEm: "2026-10-22T12:00:00.000Z" }))).toBe(false);
    expect(osEditavel(atendimentoDeTeste({ status: "agendado" }))).toBe(false);
  });

  it("atualizarOs troca só os campos da OS e recusa OS fechada", () => {
    const emAndamento = atendimentoDeTeste({ status: "em-andamento" });
    expect(atualizarOs(emAndamento, { observacoesTecnico: "Troca do anel da bomba." })).toEqual({
      ...emAndamento,
      observacoesTecnico: "Troca do anel da bomba.",
    });
    const pago = atendimentoDeTeste({ status: "concluido", pagoEm: "2026-10-22T12:00:00.000Z" });
    expect(() => atualizarOs(pago, { valorMaoDeObra: 100 })).toThrow();
  });

  it("concluída e ainda não paga, a OS ainda pode ser corrigida", () => {
    const concluido = atendimentoDeTeste({ status: "concluido" });
    expect(atualizarOs(concluido, { valorMaoDeObra: 180 }).valorMaoDeObra).toBe(180);
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
