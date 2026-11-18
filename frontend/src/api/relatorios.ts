import { baixarArquivo, requisicao } from "./cliente";

export type TipoRelatorio = "pedidos" | "atendimentos";

/** Coluna da tabela; o peso é a largura relativa dela. */
export interface ColunaRelatorio {
  titulo: string;
  tipo: "texto" | "moeda";
  peso: number;
}

/** Relatório pronto do backend; nas colunas de moeda o valor da célula vem em centavos. */
export interface Relatorio {
  titulo: string;
  periodo: string;
  geradoEm: string;
  colunas: ColunaRelatorio[];
  linhas: (string | number)[][];
  totais: { rotulo: string; centavos: number }[];
}

/** Data local no formato AAAA-MM-DD (toISOString usaria UTC e viraria o dia à noite). */
export function dataLocalIso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

// junta os filtros (sem "?") com o formato pedido
function caminhoRelatorio(tipo: TipoRelatorio, query: string, formato: string): string {
  const parametros = query ? `${query}&formato=${formato}` : `formato=${formato}`;
  return `/reports/${tipo}?${parametros}`;
}

/** Busca o relatório em JSON pra mostrar na tela. `query` são os filtros, sem o "?". */
export function buscarRelatorio(token: string, tipo: TipoRelatorio, query: string): Promise<Relatorio> {
  return requisicao<Relatorio>(caminhoRelatorio(tipo, query, "json"), { token });
}

/** Baixa o relatório como CSV ou PDF. */
export function baixarRelatorio(
  token: string,
  tipo: TipoRelatorio,
  formato: "csv" | "pdf",
  query: string,
): Promise<void> {
  const nomeArquivo = `relatorio-${tipo}-${dataLocalIso(new Date())}.${formato}`;
  return baixarArquivo(caminhoRelatorio(tipo, query, formato), token, nomeArquivo);
}
