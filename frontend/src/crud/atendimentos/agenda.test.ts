import { describe, expect, it } from "vitest";
import type { Ocupacao } from "../../tipos/tecnico";
import {
  SEM_PREFERENCIA,
  diaTemHorarioLivre,
  diasDaAgenda,
  formatarAgendamento,
  formatarDiaCurto,
  horarioEstaLivre,
  horariosDoDia,
  nomeDoTecnico,
  ocupacoesDosAtendimentos,
  partesDoDia,
  primeiroTecnicoLivre,
  tecnicoEstaLivre,
} from "./agenda";

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
  it("segunda a sexta tem 4 horários", () => {
    expect(horariosDoDia("2026-10-13")).toEqual(["08:00", "10:00", "13:30", "15:30"]);
  });

  it("sábado só tem os da manhã", () => {
    expect(horariosDoDia("2026-10-17")).toEqual(["08:00", "10:00"]);
  });

  it("domingo não tem nenhum", () => {
    expect(horariosDoDia("2026-10-18")).toEqual([]);
  });
});

describe("ocupacoesDosAtendimentos", () => {
  it("pedido cancelado não ocupa o horário", () => {
    const pedidos = [
      { tecnicoId: "carlos", data: "2026-10-20", horario: "08:00" as const, status: "aguardando" as const },
      { tecnicoId: "marcos", data: "2026-10-20", horario: "13:30" as const, status: "cancelado" as const },
    ];
    expect(ocupacoesDosAtendimentos(pedidos)).toEqual([
      { tecnicoId: "carlos", data: "2026-10-20", horario: "08:00" },
    ]);
  });

  it("pedido recusado também libera o horário", () => {
    const pedidos = [
      { tecnicoId: "rafael", data: "2026-10-21", horario: "13:30" as const, status: "recusado" as const },
      { tecnicoId: "rafael", data: "2026-10-21", horario: "15:30" as const, status: "agendado" as const },
    ];
    expect(ocupacoesDosAtendimentos(pedidos)).toEqual([
      { tecnicoId: "rafael", data: "2026-10-21", horario: "15:30" },
    ]);
  });
});

describe("tecnicoEstaLivre", () => {
  it("compromisso fixo deixa o horário ocupado toda semana", () => {
    // o Carlos nunca está livre terça às 10:00 (13 e 20 são terças)
    expect(tecnicoEstaLivre("carlos", "2026-10-13", "10:00", [])).toBe(false);
    expect(tecnicoEstaLivre("carlos", "2026-10-20", "10:00", [])).toBe(false);
    expect(tecnicoEstaLivre("carlos", "2026-10-13", "08:00", [])).toBe(true);
  });

  it("pedido ocupa o horário só daquele atendente", () => {
    const ocupacoes: Ocupacao[] = [{ tecnicoId: "carlos", data: "2026-10-13", horario: "08:00" }];
    expect(tecnicoEstaLivre("carlos", "2026-10-13", "08:00", ocupacoes)).toBe(false);
    expect(tecnicoEstaLivre("marcos", "2026-10-13", "08:00", ocupacoes)).toBe(true);
    expect(tecnicoEstaLivre("carlos", "2026-10-14", "08:00", ocupacoes)).toBe(true);
  });
});

describe("primeiroTecnicoLivre", () => {
  it("pula quem está ocupado e devolve o próximo da lista", () => {
    // terça 10:00: o Carlos tem compromisso fixo, então vai o Marcos
    expect(primeiroTecnicoLivre("2026-10-13", "10:00", [])).toBe("marcos");
  });

  it("devolve null quando ninguém está livre", () => {
    const ocupacoes: Ocupacao[] = [
      { tecnicoId: "marcos", data: "2026-10-13", horario: "10:00" },
      { tecnicoId: "rafael", data: "2026-10-13", horario: "10:00" },
    ];
    expect(primeiroTecnicoLivre("2026-10-13", "10:00", ocupacoes)).toBeNull();
  });
});

describe("horarioEstaLivre", () => {
  const todosOcupados: Ocupacao[] = [
    { tecnicoId: "carlos", data: "2026-10-14", horario: "13:30" },
    { tecnicoId: "marcos", data: "2026-10-14", horario: "13:30" },
    { tecnicoId: "rafael", data: "2026-10-14", horario: "13:30" },
  ];

  it("com atendente escolhido, olha só a agenda dele", () => {
    expect(horarioEstaLivre("carlos", "2026-10-13", "10:00", [])).toBe(false);
    expect(horarioEstaLivre("marcos", "2026-10-13", "10:00", [])).toBe(true);
  });

  it("sem preferência, basta um atendente livre", () => {
    expect(horarioEstaLivre(SEM_PREFERENCIA, "2026-10-13", "10:00", [])).toBe(true);
    expect(horarioEstaLivre(SEM_PREFERENCIA, "2026-10-14", "13:30", todosOcupados)).toBe(false);
  });
});

describe("diaTemHorarioLivre", () => {
  it("o sábado do Marcos fica apagado, mas não o dos outros", () => {
    expect(diaTemHorarioLivre("marcos", "2026-10-17", [])).toBe(false);
    expect(diaTemHorarioLivre("carlos", "2026-10-17", [])).toBe(true);
    expect(diaTemHorarioLivre(SEM_PREFERENCIA, "2026-10-17", [])).toBe(true);
  });

  it("domingo nunca tem horário livre", () => {
    expect(diaTemHorarioLivre(SEM_PREFERENCIA, "2026-10-18", [])).toBe(false);
  });
});

describe("textos da agenda", () => {
  it("formatarAgendamento junta dia, horário e atendente", () => {
    expect(formatarAgendamento("2026-10-21", "13:30", "Carlos")).toBe("21/10/2026 às 13:30 com Carlos");
  });

  it("nomeDoTecnico acha o nome pelo id", () => {
    expect(nomeDoTecnico("rafael")).toBe("Rafael");
  });

  it("partesDoDia separa o dia da semana e o número, sem zero à esquerda", () => {
    expect(partesDoDia("2026-10-14")).toEqual({ semana: "Qua", dia: "14" });
    expect(partesDoDia("2026-11-02")).toEqual({ semana: "Seg", dia: "2" });
  });

  it("formatarDiaCurto é o dia da semana em minúsculas com dia/mês", () => {
    expect(formatarDiaCurto("2026-10-17")).toBe("sáb, 17/10");
  });
});
