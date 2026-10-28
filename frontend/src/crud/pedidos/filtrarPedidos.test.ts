import { describe, expect, it } from "vitest";
import type { Pedido } from "../../tipos/pedido";
import type { Usuario } from "../../tipos/usuario";
import {
  FILTROS_PEDIDO_INICIAIS,
  comNomeDoCliente,
  contarFiltrosAtivosPedido,
  filtrarPedidos,
} from "./filtrarPedidos";
import type { FiltrosPedido, PedidoComCliente } from "./filtrarPedidos";

function pedido(dados: Partial<Pedido> & Pick<Pedido, "id">): Pedido {
  return {
    usuarioId: "u1",
    status: "PAGO",
    formaPagamento: "PIX",
    enderecoEntrega: "Rua X, 1",
    valorFrete: 0,
    valorTotal: 10,
    criadoEm: "2026-10-01T12:00:00.000Z",
    itens: [],
    ...dados,
  };
}

function usuario(id: string, nome: string): Usuario {
  return { id, nome, email: `${id}@bruxel.test`, cpf: "00000000000", perfil: "CLIENTE" };
}

function filtros(mudancas: Partial<FiltrosPedido>): FiltrosPedido {
  return { ...FILTROS_PEDIDO_INICIAIS, ...mudancas };
}

const PEDIDOS: PedidoComCliente[] = [
  {
    ...pedido({ id: "aaaa1111-x", valorTotal: 50, criadoEm: "2026-10-02T12:00:00.000Z", formaPagamento: "BOLETO" }),
    cliente: "João Hoff",
    itens: [{ produtoId: "p1", nome: "Escova de parede", quantidade: 1, precoUnitario: 50 }],
  },
  {
    ...pedido({ id: "bbbb2222-x", valorTotal: 200, criadoEm: "2026-10-01T12:00:00.000Z" }),
    cliente: "Marina Kehl",
    itens: [{ produtoId: "p2", nome: "Algicida Choque", quantidade: 2, precoUnitario: 100 }],
  },
  {
    ...pedido({ id: "cccc3333-x", valorTotal: 120, criadoEm: "2026-10-03T12:00:00.000Z" }),
    cliente: "Ana Wermann",
    itens: [{ produtoId: "p3", nome: "Peneira", quantidade: 1, precoUnitario: 120 }],
  },
];

const ids = (lista: PedidoComCliente[]) => lista.map((p) => p.id);

describe("comNomeDoCliente", () => {
  it('põe o nome do dono e "Cliente removido" quando não acha', () => {
    const lista = comNomeDoCliente(
      [pedido({ id: "1", usuarioId: "u1" }), pedido({ id: "2", usuarioId: "sumiu" })],
      [usuario("u1", "Marina Kehl")]
    );
    expect(lista.map((p) => p.cliente)).toEqual(["Marina Kehl", "Cliente removido"]);
  });
});

describe("filtrarPedidos", () => {
  it("busca acha por cliente, número e nome de produto, sem acento", () => {
    expect(ids(filtrarPedidos(PEDIDOS, filtros({ busca: "joao" })))).toEqual(["aaaa1111-x"]);
    expect(ids(filtrarPedidos(PEDIDOS, filtros({ busca: "BBBB2222" })))).toEqual(["bbbb2222-x"]);
    expect(ids(filtrarPedidos(PEDIDOS, filtros({ busca: "algicida" })))).toEqual(["bbbb2222-x"]);
  });

  it("filtra por forma de pagamento", () => {
    expect(ids(filtrarPedidos(PEDIDOS, filtros({ forma: "BOLETO" })))).toEqual(["aaaa1111-x"]);
  });

  it("ordena por recentes (padrão), antigos e maior valor", () => {
    expect(ids(filtrarPedidos(PEDIDOS, FILTROS_PEDIDO_INICIAIS))).toEqual(["cccc3333-x", "aaaa1111-x", "bbbb2222-x"]);
    expect(ids(filtrarPedidos(PEDIDOS, filtros({ ordem: "antigos" })))).toEqual(["bbbb2222-x", "aaaa1111-x", "cccc3333-x"]);
    expect(ids(filtrarPedidos(PEDIDOS, filtros({ ordem: "maior-valor" })))).toEqual(["bbbb2222-x", "cccc3333-x", "aaaa1111-x"]);
  });
});

describe("contarFiltrosAtivosPedido", () => {
  it("conta forma e ordem fora do padrão (a busca não conta)", () => {
    expect(contarFiltrosAtivosPedido(filtros({ busca: "x" }))).toBe(0);
    expect(contarFiltrosAtivosPedido(filtros({ forma: "PIX", ordem: "antigos" }))).toBe(2);
  });
});
