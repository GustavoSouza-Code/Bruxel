import { status_agendamento, status_pedido } from "../generated/prisma/enums";

// contratos usados nos relatórios da gestão

export type FormatoRelatorio = "json" | "csv" | "pdf";

export type PagamentoRelatorio = "pago" | "a-receber";

// valor de uma célula: texto, ou centavos quando a coluna é de moeda
export type CelulaRelatorio = string | number;

// coluna da tabela; o peso define a largura relativa no PDF
export interface ColunaRelatorio {
    titulo: string;
    tipo: "texto" | "moeda";
    peso: number;
}

// linha de resumo exibida depois da tabela
export interface TotalRelatorio {
    rotulo: string;
    centavos: number;
}

// relatório já pronto, sem depender do formato de saída
export interface Relatorio {
    titulo: string;
    periodo: string;
    geradoEm: string;
    colunas: ColunaRelatorio[];
    linhas: CelulaRelatorio[][];
    totais: TotalRelatorio[];
}

// filtros de período já validados; o fim é exclusivo (dia seguinte, às 00h)
export interface PeriodoRelatorio {
    inicio?: Date;
    fimExclusivo?: Date;
}

// filtros que o repository aplica na listagem de pedidos
export interface FiltrosRelatorioPedidos extends PeriodoRelatorio {
    status?: status_pedido;
}

// filtros que o repository aplica na listagem de atendimentos
export interface FiltrosRelatorioAtendimentos extends PeriodoRelatorio {
    status?: status_agendamento;
    pagamento?: PagamentoRelatorio;
}
