import { describe, expect, it } from "vitest";
import {
  OPCOES_STATUS,
  montarQueryRelatorio,
  periodoPadrao,
} from "./filtros";
import type { FiltrosRelatorio } from "./filtros";

function filtros(mudancas: Partial<FiltrosRelatorio>): FiltrosRelatorio {
  return { inicio: "", fim: "", status: "", pagamento: "", ...mudancas };
}

describe("periodoPadrao", () => {
  it("vai do 1º dia do mês até hoje, em data local", () => {
    expect(periodoPadrao(new Date(2026, 10, 16, 23, 30))).toEqual({ inicio: "2026-11-01", fim: "2026-11-16" });
  });
});

describe("montarQueryRelatorio", () => {
  it("não inclui pagamento em pedidos", () => {
    const query = montarQueryRelatorio("pedidos", filtros({ inicio: "2026-11-01", fim: "2026-11-16", pagamento: "pago" }));
    expect(query).not.toContain("pagamento");
    expect(query).toBe("inicio=2026-11-01&fim=2026-11-16");
  });

  it("monta status e pagamento em atendimentos", () => {
    const query = montarQueryRelatorio("atendimentos", filtros({ status: "AGENDADO", pagamento: "pago" }));
    expect(query).toBe("status=AGENDADO&pagamento=pago");
  });

  it('troca o status por CONCLUIDO quando pagamento é "a-receber"', () => {
    const query = montarQueryRelatorio("atendimentos", filtros({ status: "AGENDADO", pagamento: "a-receber" }));
    expect(query).toContain("status=CONCLUIDO&pagamento=a-receber");
  });

  it('dá "" quando todos os filtros estão vazios', () => {
    expect(montarQueryRelatorio("pedidos", filtros({}))).toBe("");
    expect(montarQueryRelatorio("atendimentos", filtros({}))).toBe("");
  });
});

describe("OPCOES_STATUS", () => {
  it('começa com "Todas" em cada tipo e tem os rótulos do back', () => {
    expect(OPCOES_STATUS.pedidos).toEqual([
      { valor: "", rotulo: "Todas" },
      { valor: "PENDENTE", rotulo: "Pendente" },
      { valor: "PAGO", rotulo: "Pago" },
      { valor: "ENVIADO", rotulo: "Enviado" },
      { valor: "ENTREGUE", rotulo: "Entregue" },
      { valor: "CANCELADO", rotulo: "Cancelado" },
    ]);
    expect(OPCOES_STATUS.atendimentos).toEqual([
      { valor: "", rotulo: "Todas" },
      { valor: "DISPONIVEL", rotulo: "Disponível" },
      { valor: "AGUARDANDO", rotulo: "Aguardando confirmação" },
      { valor: "AGENDADO", rotulo: "Agendado" },
      { valor: "EM_ANDAMENTO", rotulo: "Em andamento" },
      { valor: "CONCLUIDO", rotulo: "Concluído" },
      { valor: "CANCELADO", rotulo: "Cancelado" },
      { valor: "RECUSADO", rotulo: "Recusado" },
    ]);
  });
});
