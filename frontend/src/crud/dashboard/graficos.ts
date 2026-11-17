import type { ReceitaMensalLinha, ReceitaPorCategoriaLinha } from "../../api/dashboard";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-11" vira "nov" (ou "novembro" com `longo`). Nomes fixos, sem Intl. */
export function rotuloMes(mes: string, longo = false): string {
  const nome = MESES[Number(mes.slice(5, 7)) - 1] ?? mes;
  return longo ? nome : nome.slice(0, 3);
}

/** Menor passo "redondo" (1, 2, 2,5, 5 ou 10 × 10ⁿ) que é pelo menos `minimo`. */
function passoRedondo(minimo: number): number {
  const base = 10 ** Math.floor(Math.log10(minimo));
  for (const f of [1, 2, 2.5, 5, 10]) {
    if (f * base >= minimo) return f * base;
  }
  return 10 * base;
}

/** Escala do eixo das barras empilhadas (loja + serviços): marcas em passos redondos. */
export function escalaBarras(
  linhas: ReceitaMensalLinha[],
  marcas = 4,
): { maximo: number; marcas: number[] } {
  const maior = Math.max(0, ...linhas.map((l) => l.loja + l.servicos));
  if (maior <= 0) return { maximo: 0, marcas: [0] };
  const passo = passoRedondo(maior / marcas);
  const quantidade = Math.ceil(maior / passo - 1e-9);
  const maximo = quantidade * passo;
  return {
    maximo,
    marcas: Array.from({ length: quantidade + 1 }, (_, i) => i * passo),
  };
}

export const PALETA_ROSCA = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-wave)",
  "var(--color-accent-light)",
  "#d8d9f5",
];
export const COR_OUTRAS = "#b8b8c4";

export type FatiaRosca = {
  label: string;
  value: number;
  percentual: number;
  cor: string;
};

/**
 * Fatias da rosca: maiores primeiro, o excedente de `maxFatias` vira "Outras".
 * Percentuais inteiros pelo método do maior resto, para a soma fechar 100.
 */
export function fatiasRosca(
  linhas: ReceitaPorCategoriaLinha[],
  maxFatias = 5,
): FatiaRosca[] {
  const ordenadas = linhas
    .filter((l) => l.value > 0)
    .sort((a, b) => b.value - a.value);
  let base = ordenadas;
  if (ordenadas.length > maxFatias) {
    const resto = ordenadas.slice(maxFatias - 1);
    base = [
      ...ordenadas.slice(0, maxFatias - 1),
      { label: "Outras", value: resto.reduce((s, l) => s + l.value, 0) },
    ];
  }
  const total = base.reduce((s, l) => s + l.value, 0);
  if (total <= 0) return [];

  const exatos = base.map((l) => (l.value / total) * 100);
  const percentuais = exatos.map(Math.floor);
  let faltam = 100 - percentuais.reduce((s, p) => s + p, 0);
  const porResto = exatos
    .map((e, i) => ({ i, resto: e - percentuais[i] }))
    .sort((a, b) => b.resto - a.resto);
  for (const { i } of porResto) {
    if (faltam <= 0) break;
    percentuais[i] += 1;
    faltam -= 1;
  }

  return base.map((l, i) => ({
    label: l.label,
    value: l.value,
    percentual: percentuais[i],
    cor:
      ordenadas.length > maxFatias && i === base.length - 1
        ? COR_OUTRAS
        : PALETA_ROSCA[i % PALETA_ROSCA.length],
  }));
}
