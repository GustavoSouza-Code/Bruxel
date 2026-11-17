import { formatarReais } from "../atendimentos/valorOs";

/** Texto e tom da variação de receita contra o mês anterior. */
export function textoVariacao(
  variacao: number | null,
  mesAnterior: string,
): { texto: string; tom: "alta" | "queda" | "neutro" } {
  if (variacao === null) {
    return { texto: `sem receita em ${mesAnterior}`, tom: "neutro" };
  }
  const pct = Math.round(Math.abs(variacao));
  if (pct === 0) return { texto: `0% vs ${mesAnterior}`, tom: "neutro" };
  return variacao > 0
    ? { texto: `▲ ${pct}% vs ${mesAnterior}`, tom: "alta" }
    : { texto: `▼ ${pct}% vs ${mesAnterior}`, tom: "queda" };
}

export function formatarCentavos(centavos: number): string {
  return formatarReais(centavos / 100);
}

/** Valor curto para eixo e centro da rosca: 5900 vira "R$ 5,9 mil". */
export function reaisCurtos(valor: number): string {
  if (valor >= 1000) {
    const mil = (Math.round(valor / 100) / 10).toString().replace(".", ",");
    return `R$ ${mil} mil`;
  }
  return `R$ ${Math.round(valor)}`;
}
