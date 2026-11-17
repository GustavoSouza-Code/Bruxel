import { AppError } from "../errors/AppError";
import { forma_pagamento, status_agendamento, status_pedido, tipo_servico } from "../generated/prisma/enums";
import {
    FormatoRelatorio,
    FiltrosRelatorioAtendimentos,
    FiltrosRelatorioPedidos,
    PagamentoRelatorio,
    PeriodoRelatorio,
    Relatorio,
} from "../models/report";
import { ReportsRepository } from "../repository/reportsRepository";
import { formatarData, formatarDataHora } from "../utils/formataRelatorio";

const FORMATOS = ["json", "csv", "pdf"] as const;
const PAGAMENTOS = ["pago", "a-receber"] as const;
const STATUS_PEDIDOS = Object.values(status_pedido) as readonly string[];
const STATUS_ATENDIMENTOS = Object.values(status_agendamento) as readonly string[];

// acima disso o período é grande demais para um arquivo só; o admin deve filtrar por datas
const LIMITE_DE_LINHAS = 5000;

// o Brasil não tem horário de verão desde 2019, então o fuso fixo de Brasília é seguro
const INICIO_DO_DIA = "T00:00:00-03:00";
const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

const FORMA_PAGAMENTO_LABELS: Record<forma_pagamento, string> = {
    PIX: "Pix",
    CARTAO_CREDITO: "Cartão de crédito",
    BOLETO: "Boleto",
};

const STATUS_PEDIDO_LABELS: Record<status_pedido, string> = {
    PENDENTE: "Pendente",
    PAGO: "Pago",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
};

const STATUS_ATENDIMENTO_LABELS: Record<status_agendamento, string> = {
    DISPONIVEL: "Disponível",
    AGUARDANDO: "Aguardando confirmação",
    AGENDADO: "Agendado",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado",
    RECUSADO: "Recusado",
};

const TIPO_SERVICO_LABELS: Record<tipo_servico, string> = {
    LIMPEZA: "Limpeza e manutenção",
    BOMBA_FILTRO: "Bomba e filtro",
    VAZAMENTO: "Vazamento",
    INSTALACAO: "Instalação",
    OUTRO: "Outro",
};

// valores do banco em centavos inteiros, para não acumular erro de ponto flutuante
const emCentavos = (valor: unknown) => Math.round(Number(valor) * 100);

// mesmo código curto que o frontend mostra: os 8 primeiros caracteres do UUID
const codigoCurto = (id: string) => id.slice(0, 8).toUpperCase();

type Filtros = Record<string, unknown>;

// camada service dos relatórios: valida os filtros e monta o relatório, sem saber o formato de saída
export class ReportsService {
    private reportsRepository = new ReportsRepository();

    // relatório de vendas da loja; pedidos cancelados aparecem na lista, mas não entram no total
    async pedidos(filtros: Filtros): Promise<Relatorio> {
        const periodo = this.validarPeriodo(filtros);
        const status = this.validarStatus<status_pedido>(filtros.status, STATUS_PEDIDOS);
        const consulta: FiltrosRelatorioPedidos = { ...periodo, status };

        const pedidos = await this.reportsRepository.getPedidos(consulta, LIMITE_DE_LINHAS + 1);
        this.conferirLimite(pedidos.length);

        const totalVendido = pedidos
            .filter((pedido) => pedido.status !== "CANCELADO")
            .reduce((soma, pedido) => soma + emCentavos(pedido.valor_total), 0);

        return {
            titulo: "Relatório de pedidos da loja",
            periodo: this.descreverPeriodo(periodo),
            geradoEm: formatarDataHora(new Date()),
            colunas: [
                { titulo: "Pedido", tipo: "texto", peso: 1 },
                { titulo: "Data", tipo: "texto", peso: 1.5 },
                { titulo: "Cliente", tipo: "texto", peso: 3 },
                { titulo: "Pagamento", tipo: "texto", peso: 1.8 },
                { titulo: "Situação", tipo: "texto", peso: 1.5 },
                { titulo: "Total", tipo: "moeda", peso: 1.5 },
            ],
            linhas: pedidos.map((pedido) => [
                codigoCurto(pedido.id),
                formatarDataHora(pedido.criado_em),
                pedido.users.nome,
                FORMA_PAGAMENTO_LABELS[pedido.forma_pagamento],
                STATUS_PEDIDO_LABELS[pedido.status],
                emCentavos(pedido.valor_total),
            ]),
            totais: [{ rotulo: "Total vendido (sem cancelados)", centavos: totalVendido }],
        };
    }

    // relatório de ordens de serviço; separa o que já foi recebido do que ainda está a receber
    async atendimentos(filtros: Filtros): Promise<Relatorio> {
        const periodo = this.validarPeriodo(filtros);
        const pagamento = this.validarPagamento(filtros.pagamento);
        const status = this.validarStatusDoAtendimento(filtros.status, pagamento);
        const consulta: FiltrosRelatorioAtendimentos = { ...periodo, status, pagamento };

        const atendimentos = await this.reportsRepository.getAtendimentos(consulta, LIMITE_DE_LINHAS + 1);
        this.conferirLimite(atendimentos.length);

        let recebido = 0;
        let aReceber = 0;

        const linhas = atendimentos.map((atendimento) => {
            // total da OS: mão de obra mais os produtos usados, com o preço que valia na hora
            const total =
                emCentavos(atendimento.valor_mao_de_obra ?? 0) +
                atendimento.itens.reduce((soma, item) => soma + emCentavos(item.preco_unitario) * item.quantidade, 0);

            if (atendimento.pago_em) {
                recebido += total;
            } else if (atendimento.status === "CONCLUIDO") {
                aReceber += total;
            }

            return [
                codigoCurto(atendimento.id),
                formatarDataHora(atendimento.data_hora),
                atendimento.cliente?.nome ?? atendimento.nome_cliente ?? "Cliente do balcão",
                atendimento.tipo ? TIPO_SERVICO_LABELS[atendimento.tipo] : "-",
                STATUS_ATENDIMENTO_LABELS[atendimento.status],
                total,
                atendimento.pago_em ? formatarData(atendimento.pago_em) : atendimento.status === "CONCLUIDO" ? "A receber" : "-",
            ];
        });

        return {
            titulo: "Relatório de ordens de serviço",
            periodo: this.descreverPeriodo(periodo),
            geradoEm: formatarDataHora(new Date()),
            colunas: [
                { titulo: "OS", tipo: "texto", peso: 1 },
                { titulo: "Visita", tipo: "texto", peso: 1.6 },
                { titulo: "Cliente", tipo: "texto", peso: 2.8 },
                { titulo: "Serviço", tipo: "texto", peso: 2 },
                { titulo: "Situação", tipo: "texto", peso: 1.8 },
                { titulo: "Total", tipo: "moeda", peso: 1.4 },
                { titulo: "Pagamento", tipo: "texto", peso: 1.4 },
            ],
            linhas,
            totais: [
                { rotulo: "Recebido", centavos: recebido },
                { rotulo: "A receber (OS concluídas sem pagamento)", centavos: aReceber },
            ],
        };
    }

    // formato de saída pedido na URL; sem o parâmetro, devolve JSON
    validarFormato(valor: unknown): FormatoRelatorio {
        if (valor === undefined) {
            return "json";
        }
        if (typeof valor !== "string" || !(FORMATOS as readonly string[]).includes(valor)) {
            throw new AppError(400, "Formato inválido. Use json, csv ou pdf.");
        }
        return valor as FormatoRelatorio;
    }

    // inicio e fim chegam como aaaa-mm-dd; o fim vira o começo do dia seguinte para incluir o último dia inteiro
    private validarPeriodo(filtros: Filtros): PeriodoRelatorio {
        const inicio = this.lerData(filtros.inicio, "inicio");
        const fim = this.lerData(filtros.fim, "fim");

        if (inicio && fim && inicio > fim) {
            throw new AppError(400, "A data inicial não pode ser depois da final.");
        }

        return {
            inicio,
            fimExclusivo: fim ? new Date(fim.getTime() + UM_DIA_EM_MS) : undefined,
        };
    }

    private lerData(valor: unknown, campo: string): Date | undefined {
        if (valor === undefined || valor === "") {
            return undefined;
        }

        if (typeof valor !== "string" || !this.ehDataReal(valor)) {
            throw new AppError(400, `Data inválida em ${campo}. Use o formato aaaa-mm-dd.`);
        }
        return new Date(`${valor}${INICIO_DO_DIA}`);
    }

    // o Date aceita 31/02 e "rola" para março, então o dia precisa voltar igual depois da conversão
    private ehDataReal(valor: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            return false;
        }

        const [ano, mes, dia] = valor.split("-").map(Number);
        const data = new Date(Date.UTC(ano, mes - 1, dia));
        return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
    }

    private validarStatus<T extends string>(valor: unknown, permitidos: readonly string[]): T | undefined {
        if (valor === undefined || valor === "") {
            return undefined;
        }
        if (typeof valor !== "string" || !permitidos.includes(valor)) {
            throw new AppError(400, `Situação inválida. Use: ${permitidos.join(", ")}.`);
        }
        return valor as T;
    }

    private validarPagamento(valor: unknown): PagamentoRelatorio | undefined {
        if (valor === undefined || valor === "") {
            return undefined;
        }
        if (typeof valor !== "string" || !(PAGAMENTOS as readonly string[]).includes(valor)) {
            throw new AppError(400, "Pagamento inválido. Use pago ou a-receber.");
        }
        return valor as PagamentoRelatorio;
    }

    // "a-receber" só existe para OS concluída, então ele fixa a situação ou recusa uma que não combine
    private validarStatusDoAtendimento(valor: unknown, pagamento?: PagamentoRelatorio): status_agendamento | undefined {
        const status = this.validarStatus<status_agendamento>(valor, STATUS_ATENDIMENTOS);

        if (pagamento === "a-receber") {
            if (status && status !== "CONCLUIDO") {
                throw new AppError(400, "A receber só vale para ordens de serviço concluídas.");
            }
            return "CONCLUIDO";
        }
        return status;
    }

    // o repository busca uma linha a mais que o limite só para este service saber que passou
    private conferirLimite(quantidade: number) {
        if (quantidade > LIMITE_DE_LINHAS) {
            throw new AppError(400, `O relatório passa de ${LIMITE_DE_LINHAS} linhas. Reduza o período.`);
        }
    }

    private descreverPeriodo(periodo: PeriodoRelatorio): string {
        if (!periodo.inicio && !periodo.fimExclusivo) {
            return "Todo o período";
        }

        const inicio = periodo.inicio ? formatarData(periodo.inicio) : "o começo";
        const fim = periodo.fimExclusivo ? formatarData(new Date(periodo.fimExclusivo.getTime() - UM_DIA_EM_MS)) : "hoje";
        return `${inicio} a ${fim}`;
    }
}
