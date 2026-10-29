import type { FormaPagamento, StatusPedido } from "../../tipos/pedido";

/** Texto de cada status do pedido, igual no perfil, na confirmação e no painel. */
export const STATUS_PEDIDO_LABELS: Record<StatusPedido, string> = {
  PENDENTE: "Aguardando pagamento",
  PAGO: "Pago",
  ENVIADO: "A caminho",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

/** Texto de cada forma de pagamento. */
export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  PIX: "Pix",
  CARTAO_CREDITO: "Cartão de crédito",
  BOLETO: "Boleto",
};

/** Número curto do pedido na tela: os 8 primeiros caracteres do UUID, em maiúsculo. */
export function codigoPedido(id: string) {
  return id.slice(0, 8).toUpperCase();
}

/** O pagamento já entrou? (pago, a caminho ou entregue) */
export function pedidoRecebido(status: StatusPedido) {
  return status === "PAGO" || status === "ENVIADO" || status === "ENTREGUE";
}
