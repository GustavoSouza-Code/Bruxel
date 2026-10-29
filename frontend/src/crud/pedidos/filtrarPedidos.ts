import type { FormaPagamento, Pedido } from "../../tipos/pedido";
import type { Usuario } from "../../tipos/usuario";
import { contemTexto } from "../busca";
import { codigoPedido } from "./opcoesPedido";

/** Pedido com o nome de quem comprou (o GET /orders só manda o usuario_id). */
export type PedidoComCliente = Pedido & { cliente: string };

export type OrdemPedido = "recentes" | "antigos" | "maior-valor";

/** O que está escolhido na busca e no painel de filtros da tela de pedidos. */
export interface FiltrosPedido {
  busca: string;
  /** "" = qualquer forma */
  forma: "" | FormaPagamento;
  ordem: OrdemPedido;
}

export const FILTROS_PEDIDO_INICIAIS: FiltrosPedido = {
  busca: "",
  forma: "",
  ordem: "recentes",
};

/** Junta o nome do cliente em cada pedido; conta apagada vira "Cliente removido". */
export function comNomeDoCliente(pedidos: Pedido[], usuarios: Usuario[]): PedidoComCliente[] {
  const nomes = new Map(usuarios.map((usuario) => [usuario.id, usuario.nome]));
  return pedidos.map((pedido) => ({ ...pedido, cliente: nomes.get(pedido.usuarioId) ?? "Cliente removido" }));
}

const COMPARAR: Record<OrdemPedido, (a: Pedido, b: Pedido) => number> = {
  recentes: (a, b) => b.criadoEm.localeCompare(a.criadoEm),
  antigos: (a, b) => a.criadoEm.localeCompare(b.criadoEm),
  "maior-valor": (a, b) => b.valorTotal - a.valorTotal,
};

/** Aplica a busca (cliente, número ou produto), a forma de pagamento e a ordem; devolve uma lista nova. */
export function filtrarPedidos(pedidos: PedidoComCliente[], filtros: FiltrosPedido): PedidoComCliente[] {
  return pedidos
    .filter(
      (pedido) =>
        (contemTexto(pedido.cliente, filtros.busca) ||
          contemTexto(codigoPedido(pedido.id), filtros.busca) ||
          pedido.itens.some((item) => contemTexto(item.nome, filtros.busca))) &&
        (!filtros.forma || pedido.formaPagamento === filtros.forma)
    )
    .sort(COMPARAR[filtros.ordem]);
}

/** Quantos filtros do painel estão em uso (o número do botão "Filtros (n)"); a busca já aparece na tela. */
export function contarFiltrosAtivosPedido(filtros: FiltrosPedido) {
  return [filtros.forma !== "", filtros.ordem !== FILTROS_PEDIDO_INICIAIS.ordem].filter(Boolean).length;
}
