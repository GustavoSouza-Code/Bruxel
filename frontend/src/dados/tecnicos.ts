import type { HorarioVisita } from "../tipos/atendimento";
import type { Tecnico } from "../tipos/tecnico";

/**
 * Atendentes de exemplo, na ordem em que aparecem no formulário (e em que o
 * "Sem preferência" procura alguém livre).
 * TODO: trocar pela lista de técnicos do backend quando ela existir.
 */
export const TECNICOS: Tecnico[] = [
  { id: "carlos", nome: "Carlos", especialidade: "Bombas e filtros" },
  { id: "marcos", nome: "Marcos", especialidade: "Limpeza e manutenção" },
  { id: "rafael", nome: "Rafael", especialidade: "Instalação e vazamentos" },
];

/** Compromisso que se repete toda semana na agenda de um atendente. */
export interface IndisponibilidadeFixa {
  tecnicoId: string;
  /** 0 = domingo … 6 = sábado (o mesmo número do Date.getDay()) */
  diaSemana: number;
  horario: HorarioVisita;
}

/**
 * Horários que cada atendente nunca tem livres, só pra a agenda de exemplo não
 * parecer vazia. O sábado do Marcos está todo ocupado de propósito: assim dá pra
 * ver um dia apagado na faixa de dias.
 * TODO: vem da agenda do backend quando ela existir.
 */
export const INDISPONIBILIDADES_FIXAS: IndisponibilidadeFixa[] = [
  { tecnicoId: "carlos", diaSemana: 2, horario: "10:00" },
  { tecnicoId: "carlos", diaSemana: 4, horario: "13:30" },
  { tecnicoId: "marcos", diaSemana: 3, horario: "08:00" },
  { tecnicoId: "marcos", diaSemana: 3, horario: "10:00" },
  { tecnicoId: "marcos", diaSemana: 6, horario: "08:00" },
  { tecnicoId: "marcos", diaSemana: 6, horario: "10:00" },
  { tecnicoId: "rafael", diaSemana: 1, horario: "15:30" },
  { tecnicoId: "rafael", diaSemana: 5, horario: "13:30" },
  { tecnicoId: "rafael", diaSemana: 5, horario: "15:30" },
];
