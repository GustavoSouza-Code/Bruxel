// contratos usados nas respostas do dashboard da gestão

// quão atrasada está a cobrança de uma OS concluída e não paga, contando a partir do dia da visita
export type FaixaAtraso = "em_dia" | "semana" | "mes";

// receita (loja + serviços já pagos) do mês atual e do anterior, em reais
export interface ReceitaDoMes {
    atual: number;
    anterior: number;
}

// uma barra do gráfico: o mês vem como aaaa-mm e as duas origens da receita ficam separadas
export interface ReceitaMensalLinha {
    mes: string;
    loja: number;
    servicos: number;
}

// uma fatia do gráfico de pizza
export interface ReceitaPorCategoriaLinha {
    label: string;
    value: number;
}

// OS concluídas e não pagas agrupadas por faixa de atraso
export interface FaixaAReceberLinha {
    faixa: FaixaAtraso;
    quantidade: number;
    total: number;
}

// OS concluída e não paga, com o que a gestão precisa para cobrar o cliente
export interface OsAReceberLinha {
    id: string;
    cliente: string | null;
    telefone: string | null;
    data_hora: Date;
    dias: number;
    valor: number;
}

// números de apoio que aparecem nos cartões do painel
export interface ContagensOperacionais {
    os_aguardando: number;
    estoque_baixo: number;
}

// resposta dos cartões do painel
export interface KpisDashboard {
    receitaMes: number;
    receitaMesAnterior: number;
    // null quando o mês anterior não teve receita, para não dividir por zero
    variacaoPercentual: number | null;
    // atrasadas = OS concluídas e não pagas há 7 dias ou mais
    aReceber: { total: number; quantidade: number; atrasadas: number };
    osAguardando: number;
    produtosEstoqueBaixo: number;
}

// resposta da lista de cobrança
export interface AReceberDashboard {
    faixas: FaixaAReceberLinha[];
    maisAntigas: OsAReceberLinha[];
}
