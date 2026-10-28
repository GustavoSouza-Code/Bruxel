import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "../atendimentos/atendimentoDeTeste";
import type { PedidoComCliente } from "../pedidos/filtrarPedidos";
import type { Pedido } from "../../tipos/pedido";
import { contarPorSituacao, filtrarLancamentos, lancamentosDePagamento, resumoPagamentos } from "./lancamentos";
import type { Lancamento } from "./lancamentos";

function pedido(dados: Partial<Pedido> & Pick<Pedido, "id">): PedidoComCliente {
  return {
    usuarioId: "u1",
    status: "PAGO",
    formaPagamento: "PIX",
    enderecoEntrega: "Rua X",
    valorFrete: 0,
    valorTotal: 100,
    criadoEm: "2026-10-27T15:00:00.000Z",
    itens: [],
    cliente: "João Hoff",
    ...dados,
  };
}

function lancamento(dados: Partial<Lancamento> & Pick<Lancamento, "id">): Lancamento {
  return {
    origem: "pedido",
    codigo: dados.id.toUpperCase(),
    cliente: "Fulano",
    data: "2026-10-10T12:00:00.000Z",
    valor: 10,
    situacao: "recebido",
    formaPagamento: "PIX",
    ...dados,
  };
}

const CONCLUIDA_A_RECEBER = atendimentoDeTeste({
  id: "aaaa1111-os",
  status: "concluido",
  valorMaoDeObra: 100,
  produtosUsados: [{ produtoId: "p1", nome: "Cloro", precoUnitario: 25, quantidade: 2 }],
});

describe("lancamentosDePagamento", () => {
  it("OS concluída sem pagoEm vira a receber com o totalOs", () => {
    const [os] = lancamentosDePagamento([CONCLUIDA_A_RECEBER], []);
    expect(os).toMatchObject({ origem: "os", codigo: "AAAA1111", cliente: "Ana Souza", valor: 150, situacao: "a-receber", formaPagamento: null });
    expect(os.data).toBe(new Date("2026-10-21T13:30:00").toISOString());
  });

  it("OS concluída com pagoEm vira recebido na data do pagamento", () => {
    const paga = { ...CONCLUIDA_A_RECEBER, pagoEm: "2026-10-22T10:00:00.000Z" };
    expect(lancamentosDePagamento([paga], [])[0]).toMatchObject({ situacao: "recebido", data: "2026-10-22T10:00:00.000Z" });
  });

  it("OS não concluída fica de fora", () => {
    expect(lancamentosDePagamento([atendimentoDeTeste({ status: "em-andamento", valorMaoDeObra: 80 })], [])).toEqual([]);
  });

  it("OS concluída com total 0 continua a receber", () => {
    const zerada = atendimentoDeTeste({ status: "concluido" });
    expect(lancamentosDePagamento([zerada], [])[0]).toMatchObject({ valor: 0, situacao: "a-receber" });
  });

  it("pedido PAGO, ENVIADO e ENTREGUE é recebido; PENDENTE é a receber; CANCELADO fica de fora", () => {
    const lista = lancamentosDePagamento(
      [],
      [
        pedido({ id: "p1", status: "PAGO" }),
        pedido({ id: "p2", status: "ENVIADO" }),
        pedido({ id: "p3", status: "ENTREGUE" }),
        pedido({ id: "p4", status: "PENDENTE" }),
        pedido({ id: "p5", status: "CANCELADO" }),
      ]
    );
    expect(lista.map((l) => [l.id, l.situacao])).toEqual([
      ["p1", "recebido"],
      ["p2", "recebido"],
      ["p3", "recebido"],
      ["p4", "a-receber"],
    ]);
    expect(lista[0]).toMatchObject({ origem: "pedido", cliente: "João Hoff", valor: 100, formaPagamento: "PIX", data: "2026-10-27T15:00:00.000Z" });
  });
});

describe("resumoPagamentos", () => {
  const hoje = new Date(2026, 9, 28);

  it("conta o pagamento de 00:05 do dia 1 e não o de 23:55 do mês anterior", () => {
    const resumo = resumoPagamentos(
      [
        lancamento({ id: "dentro", origem: "os", valor: 30, data: new Date(2026, 9, 1, 0, 5).toISOString() }),
        lancamento({ id: "fora", valor: 70, data: new Date(2026, 8, 30, 23, 55).toISOString() }),
        lancamento({ id: "pedido", valor: 20, data: new Date(2026, 9, 15, 12, 0).toISOString() }),
        lancamento({ id: "devendo", origem: "os", valor: 150, situacao: "a-receber" }),
      ],
      hoje
    );
    expect(resumo).toEqual({ aReceber: { valor: 150, quantidade: 1 }, recebidoNoMes: { valor: 50, pedidos: 1, os: 1 } });
  });

  it("soma em centavos", () => {
    const resumo = resumoPagamentos(
      [
        lancamento({ id: "a", valor: 0.1, data: new Date(2026, 9, 2).toISOString() }),
        lancamento({ id: "b", valor: 0.2, data: new Date(2026, 9, 3).toISOString() }),
      ],
      hoje
    );
    expect(resumo.recebidoNoMes.valor).toBe(0.3);
  });
});

describe("filtrarLancamentos", () => {
  const LISTA = [
    lancamento({ id: "velho", cliente: "Marina Kehl", data: "2026-10-01T12:00:00.000Z", situacao: "a-receber" }),
    lancamento({ id: "novo", cliente: "João Hoff", data: "2026-10-20T12:00:00.000Z" }),
    lancamento({ id: "meio", cliente: "Ana Wermann", data: "2026-10-10T12:00:00.000Z" }),
  ];
  const ids = (lista: Lancamento[]) => lista.map((l) => l.id);

  it("filtra por situação e busca (cliente ou código) e ordena do mais recente", () => {
    expect(ids(filtrarLancamentos(LISTA, { situacao: "todos", busca: "" }))).toEqual(["novo", "meio", "velho"]);
    expect(ids(filtrarLancamentos(LISTA, { situacao: "recebido", busca: "" }))).toEqual(["novo", "meio"]);
    expect(ids(filtrarLancamentos(LISTA, { situacao: "todos", busca: "joao" }))).toEqual(["novo"]);
    expect(ids(filtrarLancamentos(LISTA, { situacao: "todos", busca: "MEIO" }))).toEqual(["meio"]);
  });
});

describe("contarPorSituacao", () => {
  it("conta a receber, recebidos e todos", () => {
    const lista = [
      lancamento({ id: "1", situacao: "a-receber" }),
      lancamento({ id: "2" }),
      lancamento({ id: "3" }),
    ];
    expect(contarPorSituacao(lista)).toEqual({ "a-receber": 1, recebido: 2, todos: 3 });
  });
});
