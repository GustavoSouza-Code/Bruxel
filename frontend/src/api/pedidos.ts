import { requisicao } from "./cliente";
import type { FormaPagamento, Pedido, StatusPedido } from "../tipos/pedido";

/** Pedido como o backend devolve: decimais em string (Decimal do Prisma) e itens com o nome do produto. */
export interface PedidoApi {
  id: string;
  usuario_id: string;
  status: StatusPedido;
  forma_pagamento: FormaPagamento;
  endereco_entrega: string;
  valor_frete: string | number;
  valor_total: string | number;
  criado_em: string;
  atualizado_em?: string;
  order_items?: {
    id: string;
    pedido_id: string;
    produto_id: string;
    quantidade: number;
    preco_unitario: string | number;
    products: { nome: string };
  }[];
}

/** Corpo do POST /orders: o preço não vai, o backend copia do banco. */
export interface CorpoPedido {
  itens: { produto_id: string; quantidade: number }[];
  forma_pagamento: FormaPagamento;
  endereco_entrega: string;
}

/** Converte o pedido da API pro formato do front (números em vez de string, nomes em camelCase). */
export function paraPedido(bruto: PedidoApi): Pedido {
  return {
    id: bruto.id,
    usuarioId: bruto.usuario_id,
    status: bruto.status,
    formaPagamento: bruto.forma_pagamento,
    enderecoEntrega: bruto.endereco_entrega,
    valorFrete: Number(bruto.valor_frete),
    valorTotal: Number(bruto.valor_total),
    criadoEm: bruto.criado_em,
    itens: (bruto.order_items ?? []).map((item) => ({
      produtoId: item.produto_id,
      nome: item.products.nome,
      quantidade: item.quantidade,
      precoUnitario: Number(item.preco_unitario),
    })),
  };
}

/** Monta o corpo do POST /orders a partir das linhas do carrinho. */
export function paraCorpoPedido(
  linhas: { produto: { id: string }; quantidade: number }[],
  formaPagamento: FormaPagamento,
  enderecoEntrega: string
): CorpoPedido {
  return {
    itens: linhas.map((linha) => ({ produto_id: linha.produto.id, quantidade: linha.quantidade })),
    forma_pagamento: formaPagamento,
    endereco_entrega: enderecoEntrega.trim(),
  };
}

/** Fecha a compra; o backend confere o estoque e dá baixa na mesma transação (409 se faltar). */
export async function criarPedido(token: string, corpo: CorpoPedido): Promise<Pedido> {
  const criado = await requisicao<PedidoApi>("/orders", { metodo: "POST", corpo, token });
  return paraPedido(criado);
}

/** Pedidos do usuário logado (o admin recebe todos), do mais novo pro mais antigo. */
export async function listarPedidos(token: string): Promise<Pedido[]> {
  const brutos = await requisicao<PedidoApi[]>("/orders", { token });
  return brutos.map(paraPedido);
}
