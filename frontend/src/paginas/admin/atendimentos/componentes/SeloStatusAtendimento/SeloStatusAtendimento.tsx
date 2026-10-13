import { STATUS_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import type { StatusAtendimento } from "../../../../../tipos/atendimento";
import "./SeloStatusAtendimento.css";

/** Etiqueta colorida do status do atendimento (lista e OS do painel). */
export function SeloStatusAtendimento({ status }: { status: StatusAtendimento }) {
  return <span className={`selo-atendimento selo-atendimento--${status}`}>{STATUS_LABELS[status]}</span>;
}

/** "Pago" ou "A pagar", pros atendimentos concluídos. */
export function SeloPagamento({ pagoEm }: { pagoEm: string | null }) {
  return pagoEm ? (
    <span className="selo-atendimento selo-atendimento--pago">Pago</span>
  ) : (
    <span className="selo-atendimento selo-atendimento--a-pagar">A pagar</span>
  );
}
