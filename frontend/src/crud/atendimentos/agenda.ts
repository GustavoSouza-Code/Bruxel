import type { HorarioVisita, StatusAtendimento } from "../../tipos/atendimento";
import type { Ocupacao } from "../../tipos/tecnico";
import { INDISPONIBILIDADES_FIXAS, TECNICOS } from "../../dados/tecnicos";
import { formatarData, paraDataIso } from "./datasAtendimento";

/** Valor da escolha de atendente quando o cliente não liga pra quem vem. */
export const SEM_PREFERENCIA = "qualquer";

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

/** Os horários que os pedidos ocupam; pedido cancelado libera o horário. */
export function ocupacoesDosAtendimentos(
  pedidos: (Ocupacao & { status: StatusAtendimento })[]
): Ocupacao[] {
  return pedidos
    .filter((pedido) => pedido.status !== "cancelado")
    .map(({ tecnicoId, data, horario }) => ({ tecnicoId, data, horario }));
}

/** Se o atendente pode ir naquele dia e horário: sem compromisso fixo e sem pedido ocupando. */
export function tecnicoEstaLivre(
  tecnicoId: string,
  data: string,
  horario: HorarioVisita,
  ocupacoes: Ocupacao[]
) {
  const diaSemana = diaDaSemana(data);
  const temCompromissoFixo = INDISPONIBILIDADES_FIXAS.some(
    (fixa) => fixa.tecnicoId === tecnicoId && fixa.diaSemana === diaSemana && fixa.horario === horario
  );
  if (temCompromissoFixo) return false;
  return !ocupacoes.some(
    (ocupacao) =>
      ocupacao.tecnicoId === tecnicoId && ocupacao.data === data && ocupacao.horario === horario
  );
}

/** O primeiro atendente livre (na ordem de TECNICOS) naquele dia e horário, ou null se nenhum está. */
export function primeiroTecnicoLivre(data: string, horario: HorarioVisita, ocupacoes: Ocupacao[]) {
  return TECNICOS.find((tecnico) => tecnicoEstaLivre(tecnico.id, data, horario, ocupacoes))?.id ?? null;
}

/** Se o horário serve pra escolha: o atendente escolhido está livre ou, sem preferência, algum está. */
export function horarioEstaLivre(
  escolha: string,
  data: string,
  horario: HorarioVisita,
  ocupacoes: Ocupacao[]
) {
  return escolha === SEM_PREFERENCIA
    ? primeiroTecnicoLivre(data, horario, ocupacoes) !== null
    : tecnicoEstaLivre(escolha, data, horario, ocupacoes);
}

/** Se o dia tem pelo menos um horário livre pra escolha (senão ele fica apagado na faixa de dias). */
export function diaTemHorarioLivre(escolha: string, data: string, ocupacoes: Ocupacao[]) {
  return horariosDoDia(data).some((horario) => horarioEstaLivre(escolha, data, horario, ocupacoes));
}

/** "21/10/2026 às 13:30 com Carlos" */
export function formatarAgendamento(data: string, horario: HorarioVisita, nomeTecnico: string) {
  return `${formatarData(data)} às ${horario} com ${nomeTecnico}`;
}

/** Nome do atendente pelo id; se não achar (ex.: dado antigo), mostra o próprio id. */
export function nomeDoTecnico(tecnicoId: string) {
  return TECNICOS.find((tecnico) => tecnico.id === tecnicoId)?.nome ?? tecnicoId;
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
