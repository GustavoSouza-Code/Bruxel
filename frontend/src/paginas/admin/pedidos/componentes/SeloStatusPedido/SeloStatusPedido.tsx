import { STATUS_PEDIDO_LABELS } from "../../../../../crud/pedidos/opcoesPedido";
import type { StatusPedido } from "../../../../../tipos/pedido";
// mesmas cores pastel dos selos de atendimento, pra o painel ter uma linguagem só
import "../../../atendimentos/componentes/SeloStatusAtendimento/SeloStatusAtendimento.css";

// cada status do pedido pega a cor do selo de atendimento que tem o mesmo sentido
const COR: Record<StatusPedido, string> = {
  PAGO: "pago",
  ENTREGUE: "pago",
  ENVIADO: "agendado",
  PENDENTE: "a-pagar",
  CANCELADO: "cancelado",
};

/** Etiqueta colorida do status do pedido (lista e detalhe do painel). */
export function SeloStatusPedido({ status }: { status: StatusPedido }) {
  return <span className={`selo-atendimento selo-atendimento--${COR[status]}`}>{STATUS_PEDIDO_LABELS[status]}</span>;
}

export default SeloStatusPedido;
