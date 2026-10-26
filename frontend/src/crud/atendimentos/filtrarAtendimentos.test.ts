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
  atendimentoDeTeste({ id: "aaaa0001-0000-4000-8000-000000000000", status: "aguardando", data: "2026-10-22", horario: "08:00", cliente: { id: "u1", nome: "João Silva" } }),
  atendimentoDeTeste({ id: "aaaa0002-0000-4000-8000-000000000000", status: "aguardando", data: "2026-10-20", horario: "15:30" }),
  atendimentoDeTeste({ id: "aaaa0003-0000-4000-8000-000000000000", status: "concluido", pagoEm: null, data: "2026-10-01" }),
  atendimentoDeTeste({ id: "aaaa0004-0000-4000-8000-000000000000", status: "concluido", pagoEm: "2026-10-02T12:00:00.000Z", data: "2026-10-02" }),
  atendimentoDeTeste({ id: "aaaa0005-0000-4000-8000-000000000000", status: "recusado", data: "2026-10-23" }),
  atendimentoDeTeste({ id: "aaaa0006-0000-4000-8000-000000000000", status: "cancelado", data: "2026-10-24", contato: { ...atendimentoDeTeste().contato, bairro: "Moinhos" } }),
];

const ids = (lista: { id: string }[]) => lista.map((atendimento) => atendimento.id);
const filtros = (campos: Partial<FiltrosAtendimento>) => ({ ...FILTROS_ATENDIMENTO_INICIAIS, ...campos });

describe("filtrarAtendimentos", () => {
  it("abre nos aguardando, com a visita mais próxima primeiro", () => {
    expect(ids(filtrarAtendimentos(LISTA, FILTROS_ATENDIMENTO_INICIAIS))).toEqual(["aaaa0002-0000-4000-8000-000000000000", "aaaa0001-0000-4000-8000-000000000000"]);
  });

  it("'encerrados' junta recusados e cancelados; 'todos' mostra tudo", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "encerrados" })))).toEqual(["aaaa0005-0000-4000-8000-000000000000", "aaaa0006-0000-4000-8000-000000000000"]);
    expect(filtrarAtendimentos(LISTA, filtros({ status: "todos" }))).toHaveLength(6);
  });

  it("busca pelo cliente sem acento, pelo número e pelo bairro", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "joao" })))).toEqual(["aaaa0001-0000-4000-8000-000000000000"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "AAAA0004" })))).toEqual(["aaaa0004-0000-4000-8000-000000000000"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "moinhos" })))).toEqual(["aaaa0006-0000-4000-8000-000000000000"]);
  });

  it("pagamento só olha os concluídos", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", pagamento: "a-pagar" })))).toEqual(["aaaa0003-0000-4000-8000-000000000000"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", pagamento: "pago" })))).toEqual(["aaaa0004-0000-4000-8000-000000000000"]);
  });

  it("ordem inversa põe a visita mais distante primeiro, e não altera a lista original", () => {
    const copia = [...LISTA];
    expect(ids(filtrarAtendimentos(LISTA, filtros({ ordem: "visita-desc" })))).toEqual(["aaaa0001-0000-4000-8000-000000000000", "aaaa0002-0000-4000-8000-000000000000"]);
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
  it("conta só o painel (pagamento e ordem), sem a busca e o chip", () => {
    expect(contarFiltrosAtivosAtendimento(FILTROS_ATENDIMENTO_INICIAIS)).toBe(0);
    expect(contarFiltrosAtivosAtendimento(filtros({ busca: "ana", status: "todos" }))).toBe(0);
    expect(contarFiltrosAtivosAtendimento(filtros({ pagamento: "pago", ordem: "visita-desc" }))).toBe(2);
  });
});
