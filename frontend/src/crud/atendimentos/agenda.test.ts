import { describe, expect, it } from "vitest";
import { diasDaAgenda, formatarAgendamento, formatarDiaCurto, horariosDoDia, horariosPorTurno, partesDoDia } from "./agenda";

// 12/10/2026, uma segunda-feira (no Date o mês começa em 0)
const HOJE = new Date(2026, 9, 12);

describe("diasDaAgenda", () => {
  it("são os próximos 14 dias a partir de amanhã, sem domingo", () => {
    const dias = diasDaAgenda(HOJE);
    expect(dias[0]).toBe("2026-10-13");
    expect(dias[dias.length - 1]).toBe("2026-10-26");
    // 14 dias corridos menos os domingos 18 e 25
    expect(dias).toHaveLength(12);
  });

  it("não mostra domingo", () => {
    const dias = diasDaAgenda(HOJE);
    expect(dias).not.toContain("2026-10-18");
    expect(dias).not.toContain("2026-10-25");
  });

  it("vira o mês pulando o domingo", () => {
    // sexta 30/10: amanhã é sábado 31, depois domingo 01/11 (fora) e segunda 02/11
    expect(diasDaAgenda(new Date(2026, 9, 30), 3)).toEqual(["2026-10-31", "2026-11-02"]);
  });

  it("usa o dia do relógio local, mesmo tarde da noite", () => {
    // às 23h30 no Brasil já é o dia seguinte em UTC; o primeiro dia continua sendo "amanhã" daqui
    expect(diasDaAgenda(new Date(2026, 9, 12, 23, 30))[0]).toBe("2026-10-13");
  });
});

describe("horariosDoDia", () => {
  it("segunda a sexta tem a grade de 30 min de manhã e à tarde", () => {
    expect(horariosDoDia("2026-10-13")).toEqual([
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
    ]);
  });

  it("sábado só tem a manhã", () => {
    expect(horariosDoDia("2026-10-17")).toEqual([
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });

  it("domingo não tem nenhum", () => {
    expect(horariosDoDia("2026-10-18")).toEqual([]);
  });
});

describe("horariosPorTurno", () => {
  it("separa a grade da semana em manhã e tarde", () => {
    const turnos = horariosPorTurno("2026-10-13");
    expect(turnos.manha).toHaveLength(8);
    expect(turnos.manha[0]).toBe("08:00");
    expect(turnos.tarde).toHaveLength(9);
    expect(turnos.tarde[0]).toBe("13:30");
    expect(turnos.tarde[turnos.tarde.length - 1]).toBe("17:30");
  });

  it("no sábado a tarde fica vazia", () => {
    expect(horariosPorTurno("2026-10-17").tarde).toEqual([]);
  });
});

describe("textos da agenda", () => {
  it("formatarAgendamento junta dia, horário e o técnico, quando tem", () => {
    expect(formatarAgendamento("2026-10-21", "13:30", "Carlos")).toBe("21/10/2026 às 13:30 com Carlos");
  });

  it("formatarAgendamento sem técnico mostra só dia e horário", () => {
    expect(formatarAgendamento("2026-10-21", "13:30", null)).toBe("21/10/2026 às 13:30");
  });

  it("partesDoDia separa o dia da semana e o número, sem zero à esquerda", () => {
    expect(partesDoDia("2026-10-14")).toEqual({ semana: "Qua", dia: "14" });
    expect(partesDoDia("2026-11-02")).toEqual({ semana: "Seg", dia: "2" });
  });

  it("formatarDiaCurto é o dia da semana em minúsculas com dia/mês", () => {
    expect(formatarDiaCurto("2026-10-17")).toBe("sáb, 17/10");
  });
});
