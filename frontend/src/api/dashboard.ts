import { requisicao } from "./cliente";

/** Cartões do painel; os valores em reais já vêm como número. */
export interface KpisDashboard {
  receitaMes: number;
  receitaMesAnterior: number;
  /** null quando o mês anterior não teve receita */
  variacaoPercentual: number | null;
  /** atrasadas = OS concluídas e não pagas há 7 dias ou mais */
  aReceber: { total: number; quantidade: number; atrasadas: number };
  osAguardando: number;
  produtosEstoqueBaixo: number;
}

/** Uma barra do gráfico: o mês vem como aaaa-mm, com a receita da loja e dos serviços separadas. */
export interface ReceitaMensalLinha {
  mes: string;
  loja: number;
  servicos: number;
}

/** Uma fatia do gráfico de pizza. */
export interface ReceitaPorCategoriaLinha {
  label: string;
  value: number;
}

/** Quão atrasada está a cobrança de uma OS concluída e não paga. */
export type FaixaAtraso = "em_dia" | "semana" | "mes";

/** OS concluídas e não pagas agrupadas por faixa de atraso. */
export interface FaixaAReceber {
  faixa: FaixaAtraso;
  quantidade: number;
  total: number;
}

/** OS concluída e não paga, com o que a gestão precisa pra cobrar o cliente. */
export interface OsAReceber {
  id: string;
  cliente: string | null;
  telefone: string | null;
  /** data da visita, em ISO */
  data_hora: string;
  dias: number;
  valor: number;
}

/** Resposta da lista de cobrança. */
export interface AReceberDashboard {
  faixas: FaixaAReceber[];
  maisAntigas: OsAReceber[];
}

export function buscarKpis(token: string): Promise<KpisDashboard> {
  return requisicao<KpisDashboard>("/dashboard/kpis", { token });
}

export function buscarReceitaMensal(token: string, meses: number): Promise<ReceitaMensalLinha[]> {
  return requisicao<ReceitaMensalLinha[]>(`/dashboard/receita-mensal?meses=${meses}`, { token });
}

export function buscarReceitaPorCategoria(token: string): Promise<ReceitaPorCategoriaLinha[]> {
  return requisicao<ReceitaPorCategoriaLinha[]>("/dashboard/receita-por-categoria", { token });
}

export function buscarAReceber(token: string): Promise<AReceberDashboard> {
  return requisicao<AReceberDashboard>("/dashboard/a-receber", { token });
}
