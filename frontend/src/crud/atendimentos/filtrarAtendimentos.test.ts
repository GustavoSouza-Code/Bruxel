import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "./atendimentoDeTeste";
import {
  FILTROS_ATENDIMENTO_INICIAIS,
  contarFiltrosAtivosAtendimento,
  contarPorStatus,
  filtrarAtendimentos,
} from "./filtrarAtendimentos";
import type { FiltrosAtendimento } from "./filtrarAtendimentos";

const LISTA = [
  atendimentoDeTeste({ id: "AT-2026-0001", status: "aguardando", data: "2026-10-22", horario: "08:00", cliente: { id: "u1", nome: "João Silva" } }),
  atendimentoDeTeste({ id: "AT-2026-0002", status: "aguardando", data: "2026-10-20", horario: "15:30", tecnicoId: "carlos" }),
  atendimentoDeTeste({ id: "AT-2026-0003", status: "concluido", pagoEm: null, data: "2026-10-01" }),
  atendimentoDeTeste({ id: "AT-2026-0004", status: "concluido", pagoEm: "2026-10-02T12:00:00.000Z", data: "2026-10-02" }),
  atendimentoDeTeste({ id: "AT-2026-0005", status: "recusado", data: "2026-10-23" }),
  atendimentoDeTeste({ id: "AT-2026-0006", status: "cancelado", data: "2026-10-24", contato: { ...atendimentoDeTeste().contato, bairro: "Moinhos" } }),
];

const ids = (lista: { id: string }[]) => lista.map((atendimento) => atendimento.id);
const filtros = (campos: Partial<FiltrosAtendimento>) => ({ ...FILTROS_ATENDIMENTO_INICIAIS, ...campos });

describe("filtrarAtendimentos", () => {
  it("abre nos aguardando, com a visita mais próxima primeiro", () => {
    expect(ids(filtrarAtendimentos(LISTA, FILTROS_ATENDIMENTO_INICIAIS))).toEqual(["AT-2026-0002", "AT-2026-0001"]);
  });

  it("'encerrados' junta recusados e cancelados; 'todos' mostra tudo", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "encerrados" })))).toEqual(["AT-2026-0005", "AT-2026-0006"]);
    expect(filtrarAtendimentos(LISTA, filtros({ status: "todos" }))).toHaveLength(6);
  });

  it("busca pelo cliente sem acento, pelo número e pelo bairro", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "joao" })))).toEqual(["AT-2026-0001"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "0004" })))).toEqual(["AT-2026-0004"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "moinhos" })))).toEqual(["AT-2026-0006"]);
  });

  it("filtra pelo atendente", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ tecnico: "carlos" })))).toEqual(["AT-2026-0002"]);
  });

  it("pagamento só olha os concluídos", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", pagamento: "a-pagar" })))).toEqual(["AT-2026-0003"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", pagamento: "pago" })))).toEqual(["AT-2026-0004"]);
  });

  it("ordem inversa põe a visita mais distante primeiro, e não altera a lista original", () => {
    const copia = [...LISTA];
    expect(ids(filtrarAtendimentos(LISTA, filtros({ ordem: "visita-desc" })))).toEqual(["AT-2026-0001", "AT-2026-0002"]);
    expect(LISTA).toEqual(copia);
  });
});

describe("contarPorStatus", () => {
  it("conta cada chip, com recusado e cancelado juntos", () => {
    expect(contarPorStatus(LISTA)).toEqual({
      aguardando: 2,
      agendado: 0,
      "em-andamento": 0,
      concluido: 2,
      encerrados: 2,
      todos: 6,
    });
  });
});

describe("contarFiltrosAtivosAtendimento", () => {
  it("conta só o painel (atendente, pagamento e ordem), sem a busca e o chip", () => {
    expect(contarFiltrosAtivosAtendimento(FILTROS_ATENDIMENTO_INICIAIS)).toBe(0);
    expect(contarFiltrosAtivosAtendimento(filtros({ busca: "ana", status: "todos" }))).toBe(0);
    expect(contarFiltrosAtivosAtendimento(filtros({ tecnico: "carlos", pagamento: "pago", ordem: "visita-desc" }))).toBe(3);
  });
});
