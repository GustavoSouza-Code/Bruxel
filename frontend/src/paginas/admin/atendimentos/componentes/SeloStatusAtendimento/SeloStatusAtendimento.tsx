import { STATUS_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import { nivelAtraso, rotuloAtraso } from "../../../../../crud/pagamentos/atraso";
import type { StatusAtendimento } from "../../../../../tipos/atendimento";
import "./SeloStatusAtendimento.css";

/** Etiqueta colorida do status do atendimento (lista e OS do painel). */
export function SeloStatusAtendimento({ status }: { status: StatusAtendimento }) {
  return <span className={`selo-atendimento selo-atendimento--${status}`}>{STATUS_LABELS[status]}</span>;
}

/**
 * "Atrasada há N dias" (amarelo) ou "Atrasada há N mês/meses" (vermelho), pra OS
 * concluída e não paga com a visita há 7 dias ou mais. Usado na lista de
 * atendimentos, em pagamentos e no modal de cobrança.
 */
export function SeloAtraso({ dias }: { dias: number }) {
  const nivel = nivelAtraso(dias) === "mes" ? "mes" : "semana";
  return <span className={`selo-atendimento selo-atendimento--atraso-${nivel}`}>{rotuloAtraso(dias)}</span>;
}

/** "Pago" ou "A pagar", pros atendimentos concluídos. */
export function SeloPagamento({ pagoEm }: { pagoEm: string | null }) {
  return pagoEm ? (
    <span className="selo-atendimento selo-atendimento--pago">Pago</span>
  ) : (
    <span className="selo-atendimento selo-atendimento--a-pagar">A pagar</span>
  );
}
