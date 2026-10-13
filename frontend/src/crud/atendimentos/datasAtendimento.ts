import type { PeriodoAtendimento } from "../../tipos/atendimento";
import { PERIODO_LABELS } from "./opcoesAtendimento";

/**
 * Data no formato "aaaa-mm-dd", no fuso do navegador (o toISOString usaria UTC e,
 * à noite no Brasil, já daria o dia seguinte).
 */
export function paraDataIso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Primeiro dia que dá pra escolher (amanhã), no formato do <input type="date">. */
export function dataMinima(hoje: Date) {
  // o Date ajusta sozinho quando o dia passa do fim do mês (31/12 + 1 → 01/01)
  return paraDataIso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1));
}

/** "2026-10-20" → "20/10/2026". */
export function formatarData(dataIso: string) {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Data e turno preferidos num texto só: "20/10/2026, manhã". */
export function formatarPreferencia(dataIso: string, periodo: PeriodoAtendimento) {
  return `${formatarData(dataIso)}, ${PERIODO_LABELS[periodo].toLowerCase()}`;
}
