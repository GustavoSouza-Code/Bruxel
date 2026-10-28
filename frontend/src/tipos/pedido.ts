/** Formas de pagamento aceitas no fechamento da compra (enum `forma_pagamento` do banco). */
export type FormaPagamento = "PIX" | "CARTAO_CREDITO" | "BOLETO";

/** Situação do pedido (enum `status_pedido` do banco); também vira o sufixo da classe CSS da etiqueta. */
export type StatusPedido = "PENDENTE" | "PAGO" | "ENVIADO" | "ENTREGUE" | "CANCELADO";

/** Um produto do pedido; o preço fica guardado como era na hora da compra. */
export interface ItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  /** em reais */
  precoUnitario: number;
}

/** Compra feita pelo carrinho (tabela `orders`). */
export interface Pedido {
  id: string;
  /** id da conta que comprou (o painel usa pra mostrar o nome do cliente) */
  usuarioId: string;
  status: StatusPedido;
  formaPagamento: FormaPagamento;
  enderecoEntrega: string;
  /** em reais; hoje o backend sempre grava 0 */
  valorFrete: number;
  /** em reais, já com o frete */
  valorTotal: number;
  /** data e hora da compra, em ISO */
  criadoEm: string;
  itens: ItemPedido[];
}
