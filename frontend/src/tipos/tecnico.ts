import type { HorarioVisita } from "./atendimento";

/**
 * Atendente (piscineiro) que faz as visitas. Ainda não existe no backend: os de
 * exemplo estão em dados/tecnicos.ts.
 */
export interface Tecnico {
  id: string;
  nome: string;
  /** o que ele mais faz; aparece no card, embaixo do nome */
  especialidade: string;
}

/** Um horário ocupado na agenda de um atendente. */
export interface Ocupacao {
  tecnicoId: string;
  /** "aaaa-mm-dd" */
  data: string;
  horario: HorarioVisita;
}
