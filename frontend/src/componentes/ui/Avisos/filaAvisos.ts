import type { Aviso, TipoAviso } from "../../../contexto/useAvisos";

/** Quantos avisos cabem na tela ao mesmo tempo; o mais velho sai quando chega outro. */
export const MAX_AVISOS = 3;

/** Põe o aviso novo no fim da fila, guardando só os MAX_AVISOS mais novos. */
export function empilharAviso(fila: Aviso[], novo: Aviso): Aviso[] {
  return [...fila, novo].slice(-MAX_AVISOS);
}

/** Quanto tempo o aviso fica na tela: erro fica mais, pra dar tempo de ler. */
export function duracaoDoAviso(tipo: TipoAviso): number {
  return tipo === "erro" ? 6000 : 4000;
}
