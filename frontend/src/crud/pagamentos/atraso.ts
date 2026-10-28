import type { Atendimento } from "../../tipos/atendimento";

/** A partir de quantos dias sem pagar a OS concluída conta como atrasada ("semana") e como "mês". */
export const LIMITE_SEMANA = 7;
export const LIMITE_MES = 30;

export type NivelAtraso = "em-dia" | "semana" | "mes";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Dias corridos desde o dia da visita até hoje, no relógio de quem usa (a
 * visita de ontem conta 1, mesmo que tenha sido à noite). Antes da visita, ou
 * no próprio dia, dá 0. O backend ainda não guarda quando a OS foi concluída,
 * então o dia da visita é a referência do atraso.
 */
export function diasDesdeVisita(atendimento: Pick<Atendimento, "data" | "horario">, hoje: Date): number {
  const [ano, mes, dia] = atendimento.data.split("-").map(Number);
  const visita = new Date(ano, mes - 1, dia);
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  // Math.round absorve a hora a mais ou a menos dos dias de horário de verão
  return Math.max(0, Math.round((hojeSemHora.getTime() - visita.getTime()) / UM_DIA_MS));
}

/** Em dia (menos de 7), atrasada há uma semana ou mais, ou há um mês ou mais. */
export function nivelAtraso(dias: number): NivelAtraso {
  if (dias >= LIMITE_MES) return "mes";
  if (dias >= LIMITE_SEMANA) return "semana";
  return "em-dia";
}

/** OS concluída, ainda não paga e com a visita há 7 dias ou mais. */
export function estaAtrasada(atendimento: Atendimento, hoje: Date): boolean {
  return (
    atendimento.status === "concluido" &&
    atendimento.pagoEm === null &&
    diasDesdeVisita(atendimento, hoje) >= LIMITE_SEMANA
  );
}

/** "Atrasada há 10 dias"; de 30 dias em diante, em meses ("Atrasada há 1 mês", "há 2 meses"). */
export function rotuloAtraso(dias: number): string {
  if (dias < LIMITE_MES) return `Atrasada há ${dias} dias`;
  const meses = Math.floor(dias / LIMITE_MES);
  return `Atrasada há ${meses} ${meses === 1 ? "mês" : "meses"}`;
}
