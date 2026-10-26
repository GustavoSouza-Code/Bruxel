import type { HorarioVisita } from "../../tipos/atendimento";
import { formatarData, paraDataIso } from "./datasAtendimento";

// blocos de 2h dentro do horário de funcionamento (o mesmo do rodapé)
const HORARIOS_SEMANA: HorarioVisita[] = ["08:00", "10:00", "13:30", "15:30"];
const HORARIOS_SABADO: HorarioVisita[] = ["08:00", "10:00"];

// abreviação de cada dia da semana; a posição é o número do Date.getDay() (0 = domingo)
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// dia da semana de uma data "aaaa-mm-dd" (0 = domingo), no fuso local
function diaDaSemana(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia).getDay();
}

/** Os próximos `quantidade` dias corridos a partir de amanhã, sem domingos, em "aaaa-mm-dd". */
export function diasDaAgenda(hoje: Date, quantidade = 14): string[] {
  const dias: string[] = [];
  for (let i = 1; i <= quantidade; i++) {
    // o Date ajusta sozinho a virada de mês e de ano (31/10 + 1 → 01/11)
    const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    if (dia.getDay() !== 0) dias.push(paraDataIso(dia));
  }
  return dias;
}

/** Horários de visita de um dia: 4 de segunda a sexta, 2 no sábado e nenhum no domingo. */
export function horariosDoDia(data: string): HorarioVisita[] {
  const diaSemana = diaDaSemana(data);
  if (diaSemana === 0) return [];
  return diaSemana === 6 ? HORARIOS_SABADO : HORARIOS_SEMANA;
}

/** "21/10/2026 às 13:30 com Carlos"; sem técnico definido, só "21/10/2026 às 13:30". */
export function formatarAgendamento(data: string, horario: string, nomeTecnico: string | null) {
  const quando = `${formatarData(data)} às ${horario}`;
  return nomeTecnico ? `${quando} com ${nomeTecnico}` : quando;
}

/** Pedaços de um dia pra faixa de dias: "2026-10-14" → { semana: "Qua", dia: "14" }. */
export function partesDoDia(data: string) {
  const dia = Number(data.split("-")[2]);
  return { semana: DIAS_SEMANA[diaDaSemana(data)], dia: String(dia) };
}

/** "2026-10-17" → "sáb, 17/10" (título dos horários). */
export function formatarDiaCurto(data: string) {
  const [, mes, dia] = data.split("-");
  return `${DIAS_SEMANA[diaDaSemana(data)].toLowerCase()}, ${dia}/${mes}`;
}
