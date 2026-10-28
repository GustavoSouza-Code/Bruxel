import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "../atendimentos/atendimentoDeTeste";
import { diasDesdeVisita, estaAtrasada, nivelAtraso, rotuloAtraso } from "./atraso";

const HOJE = new Date(2026, 9, 28, 15, 0);

describe("diasDesdeVisita", () => {
  it("dá 0 antes da visita e no próprio dia", () => {
    expect(diasDesdeVisita({ data: "2026-10-30", horario: "08:00" }, HOJE)).toBe(0);
    expect(diasDesdeVisita({ data: "2026-10-28", horario: "13:30" }, HOJE)).toBe(0);
  });

  it("conta 7 no sétimo dia", () => {
    expect(diasDesdeVisita({ data: "2026-10-21", horario: "13:30" }, HOJE)).toBe(7);
  });

  it("atravessa a virada do mês no relógio local", () => {
    expect(diasDesdeVisita({ data: "2026-09-28", horario: "08:00" }, HOJE)).toBe(30);
    expect(diasDesdeVisita({ data: "2026-10-31", horario: "08:00" }, new Date(2026, 10, 1, 0, 30))).toBe(1);
  });
});

describe("nivelAtraso", () => {
  it("6 em dia, 7 e 29 semana, 30 mês", () => {
    expect(nivelAtraso(6)).toBe("em-dia");
    expect(nivelAtraso(7)).toBe("semana");
    expect(nivelAtraso(29)).toBe("semana");
    expect(nivelAtraso(30)).toBe("mes");
  });
});

describe("estaAtrasada", () => {
  const velha = { status: "concluido" as const, data: "2026-10-10", horario: "13:30" };

  it("só concluída, sem pagamento e com 7 dias ou mais", () => {
    expect(estaAtrasada(atendimentoDeTeste(velha), HOJE)).toBe(true);
    expect(estaAtrasada(atendimentoDeTeste({ ...velha, pagoEm: "2026-10-12T10:00:00.000Z" }), HOJE)).toBe(false);
    expect(estaAtrasada(atendimentoDeTeste({ ...velha, status: "em-andamento" }), HOJE)).toBe(false);
    expect(estaAtrasada(atendimentoDeTeste({ ...velha, data: "2026-10-25" }), HOJE)).toBe(false);
  });
});

describe("rotuloAtraso", () => {
  it("dias até 29, depois meses", () => {
    expect(rotuloAtraso(10)).toBe("Atrasada há 10 dias");
    expect(rotuloAtraso(30)).toBe("Atrasada há 1 mês");
    expect(rotuloAtraso(65)).toBe("Atrasada há 2 meses");
  });
});
