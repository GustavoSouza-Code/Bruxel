import type { FormaPagamento, StatusAlteravel, StatusPedido } from "../../tipos/pedido";

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

/** O botão principal do pedido: o status seguinte, o texto do botão e o aviso de sucesso. */
export function proximoPasso(status: StatusPedido): { status: StatusAlteravel; rotulo: string; aviso: string } | null {
  if (status === "PAGO") {
    return { status: "ENVIADO", rotulo: "Marcar como enviado", aviso: "Pedido marcado como enviado." };
  }
  if (status === "ENVIADO") {
    return { status: "ENTREGUE", rotulo: "Marcar como entregue", aviso: "Pedido marcado como entregue." };
  }
  return null;
}

/** Dá pra cancelar enquanto o pedido não foi entregue nem cancelado. */
export function podeCancelar(status: StatusPedido) {
  return status === "PENDENTE" || status === "PAGO" || status === "ENVIADO";
}
