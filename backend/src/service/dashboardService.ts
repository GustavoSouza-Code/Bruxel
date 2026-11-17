import { AppError } from "../errors/AppError";
import {
    AReceberDashboard,
    FaixaAReceberLinha,
    FaixaAtraso,
    KpisDashboard,
    ReceitaMensalLinha,
    ReceitaPorCategoriaLinha,
} from "../models/dashboard";
import { DashboardRepository } from "../repository/dashboardRepository";

const MESES_PADRAO = 6;
const MESES_MAXIMO = 12;

// produto com esse estoque ou menos entra no alerta de reposição
const LIMITE_ESTOQUE_BAIXO = 5;
const LIMITE_LISTA_A_RECEBER = 5;

// ordem em que as faixas aparecem na resposta
const FAIXAS: FaixaAtraso[] = ["em_dia", "semana", "mes"];

// arredonda para centavos, já que a soma no banco volta como ponto flutuante
const arredondar = (valor: number) => Math.round(valor * 100) / 100;

// camada service do dashboard: junta as consultas do repository e entrega os números prontos para os gráficos
export class DashboardService {
    private dashboardRepository = new DashboardRepository();

    // cartões do painel; as consultas são independentes e rodam juntas
    async kpis(): Promise<KpisDashboard> {
        const [receita, faixas, contagens] = await Promise.all([
            this.dashboardRepository.receitaDoMes(),
            this.dashboardRepository.aReceberPorFaixa(),
            this.dashboardRepository.contagensOperacionais(LIMITE_ESTOQUE_BAIXO),
        ]);

        const completas = this.completarFaixas(faixas);
        const atrasadas = completas.filter((faixa) => faixa.faixa !== "em_dia");

        return {
            receitaMes: arredondar(receita.atual),
            receitaMesAnterior: arredondar(receita.anterior),
            variacaoPercentual:
                receita.anterior > 0 ? arredondar(((receita.atual - receita.anterior) / receita.anterior) * 100) : null,
            aReceber: {
                total: arredondar(completas.reduce((soma, faixa) => soma + faixa.total, 0)),
                quantidade: completas.reduce((soma, faixa) => soma + faixa.quantidade, 0),
                atrasadas: atrasadas.reduce((soma, faixa) => soma + faixa.quantidade, 0),
            },
            osAguardando: contagens.os_aguardando,
            produtosEstoqueBaixo: contagens.estoque_baixo,
        };
    }

    // gráfico de barras: receita da loja e dos serviços por mês
    async receitaMensal(meses: unknown): Promise<ReceitaMensalLinha[]> {
        const quantidade = this.validarMeses(meses);
        const linhas = await this.dashboardRepository.receitaMensal(quantidade);
        return linhas.map((linha) => ({
            mes: linha.mes,
            loja: arredondar(linha.loja),
            servicos: arredondar(linha.servicos),
        }));
    }

    // gráfico de pizza: vendas da loja no mês por categoria
    async receitaPorCategoria(): Promise<ReceitaPorCategoriaLinha[]> {
        const linhas = await this.dashboardRepository.receitaPorCategoria();
        return linhas.map((linha) => ({ label: linha.label, value: arredondar(linha.value) }));
    }

    // lista de cobrança: totais por faixa de atraso e as OS mais antigas
    async aReceber(): Promise<AReceberDashboard> {
        const [faixas, maisAntigas] = await Promise.all([
            this.dashboardRepository.aReceberPorFaixa(),
            this.dashboardRepository.aReceberMaisAntigas(LIMITE_LISTA_A_RECEBER),
        ]);

        return {
            faixas: this.completarFaixas(faixas),
            maisAntigas: maisAntigas.map((os) => ({ ...os, valor: arredondar(os.valor) })),
        };
    }

    // o banco só devolve as faixas que têm OS; o front sempre recebe as três, com zero onde não há nada
    private completarFaixas(faixas: FaixaAReceberLinha[]): FaixaAReceberLinha[] {
        return FAIXAS.map((faixa) => {
            const encontrada = faixas.find((linha) => linha.faixa === faixa);
            return {
                faixa,
                quantidade: encontrada?.quantidade ?? 0,
                total: arredondar(encontrada?.total ?? 0),
            };
        });
    }

    // meses chega pela URL; sem o parâmetro usa 6, e só aceita inteiro de 1 a 12
    private validarMeses(valor: unknown): number {
        if (valor === undefined) {
            return MESES_PADRAO;
        }

        const meses = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : NaN;
        if (!Number.isInteger(meses) || meses < 1 || meses > MESES_MAXIMO) {
            throw new AppError(400, `Informe meses entre 1 e ${MESES_MAXIMO}.`);
        }
        return meses;
    }
}
