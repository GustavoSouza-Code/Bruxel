import { prisma } from "../database/prisma";
import { Prisma } from "../generated/prisma/client";
import {
    ContagensOperacionais,
    FaixaAReceberLinha,
    OsAReceberLinha,
    ReceitaDoMes,
    ReceitaMensalLinha,
    ReceitaPorCategoriaLinha,
} from "../models/dashboard";

// mês, dia e hora sempre no horário de Brasília; sem isso um pedido às 22h do dia 31 cairia no mês seguinte
const FUSO = Prisma.raw("'America/Sao_Paulo'");

// a compra nasce paga, então só o cancelado e o pendente ficam fora da receita
const STATUS_PEDIDO_RECEBIDO = Prisma.raw("('PAGO', 'ENVIADO', 'ENTREGUE')");

// total da OS: mão de obra mais os produtos usados, com o preço que valia na hora
const VALOR_OS = Prisma.raw(`
    COALESCE(a.valor_mao_de_obra, 0) + COALESCE(
        (SELECT SUM(i.quantidade * i.preco_unitario) FROM appointment_items i WHERE i.appointment_id = a.id), 0)
`);

const MES_ATUAL = Prisma.sql`date_trunc('month', now() AT TIME ZONE ${FUSO})`;

// dias corridos desde a visita; a OS ainda não tem data de conclusão, então o atraso conta daqui
const DIAS_DESDE_A_VISITA = Prisma.sql`(now() AT TIME ZONE ${FUSO})::date - (a.data_hora AT TIME ZONE ${FUSO})::date`;

// receita por mês e por origem: o pedido conta na data da compra e a OS na data do pagamento (regime de caixa)
const RECEITAS = Prisma.sql`
    SELECT 'loja' AS origem, date_trunc('month', o.criado_em AT TIME ZONE ${FUSO}) AS mes, o.valor_total AS valor
    FROM orders o
    WHERE o.status IN ${STATUS_PEDIDO_RECEBIDO}
    UNION ALL
    SELECT 'servico', date_trunc('month', a.pago_em AT TIME ZONE ${FUSO}), ${VALOR_OS}
    FROM appointments a
    WHERE a.pago_em IS NOT NULL
`;

// OS concluída que ainda não foi paga
const OS_A_RECEBER = Prisma.sql`a.status = 'CONCLUIDO' AND a.pago_em IS NULL`;

// consultas agregadas do dashboard; as somas ficam no banco e os valores voltam como número em reais
export class DashboardRepository {

    // receita do mês atual e do anterior, para o cartão e a variação percentual
    async receitaDoMes(): Promise<ReceitaDoMes> {
        const [linha] = await prisma.$queryRaw<ReceitaDoMes[]>(Prisma.sql`
            WITH receitas AS (${RECEITAS})
            SELECT
                COALESCE(SUM(valor) FILTER (WHERE mes = ${MES_ATUAL}), 0)::float8 AS atual,
                COALESCE(SUM(valor) FILTER (WHERE mes = ${MES_ATUAL} - interval '1 month'), 0)::float8 AS anterior
            FROM receitas
        `);
        return linha;
    }

    // últimos N meses; o generate_series garante uma linha por mês, mesmo sem nenhuma venda
    async receitaMensal(meses: number): Promise<ReceitaMensalLinha[]> {
        return prisma.$queryRaw<ReceitaMensalLinha[]>(Prisma.sql`
            WITH receitas AS (${RECEITAS}),
            serie AS (
                SELECT generate_series(
                    ${MES_ATUAL} - make_interval(months => ${meses - 1}::int),
                    ${MES_ATUAL},
                    interval '1 month'
                ) AS mes
            )
            SELECT
                to_char(s.mes, 'YYYY-MM') AS mes,
                COALESCE(SUM(r.valor) FILTER (WHERE r.origem = 'loja'), 0)::float8 AS loja,
                COALESCE(SUM(r.valor) FILTER (WHERE r.origem = 'servico'), 0)::float8 AS servicos
            FROM serie s
            LEFT JOIN receitas r ON r.mes = s.mes
            GROUP BY s.mes
            ORDER BY s.mes
        `);
    }

    // vendas da loja no mês por categoria; os produtos usados em OS ficam de fora porque já estão no total da OS
    async receitaPorCategoria(): Promise<ReceitaPorCategoriaLinha[]> {
        return prisma.$queryRaw<ReceitaPorCategoriaLinha[]>(Prisma.sql`
            SELECT c.nome AS label, SUM(oi.quantidade * oi.preco_unitario)::float8 AS value
            FROM order_items oi
            JOIN orders o ON o.id = oi.pedido_id
            JOIN products p ON p.id = oi.produto_id
            JOIN categories c ON c.id = p.categoria_id
            WHERE o.status IN ${STATUS_PEDIDO_RECEBIDO}
              AND date_trunc('month', o.criado_em AT TIME ZONE ${FUSO}) = ${MES_ATUAL}
            GROUP BY c.nome
            ORDER BY 2 DESC
        `);
    }

    // OS não pagas por faixa de atraso: menos de 7 dias, de 7 a 29 e 30 ou mais
    async aReceberPorFaixa(): Promise<FaixaAReceberLinha[]> {
        return prisma.$queryRaw<FaixaAReceberLinha[]>(Prisma.sql`
            SELECT
                CASE WHEN t.dias >= 30 THEN 'mes' WHEN t.dias >= 7 THEN 'semana' ELSE 'em_dia' END AS faixa,
                COUNT(*)::int AS quantidade,
                COALESCE(SUM(t.valor), 0)::float8 AS total
            FROM (
                SELECT ${DIAS_DESDE_A_VISITA} AS dias, ${VALOR_OS} AS valor
                FROM appointments a
                WHERE ${OS_A_RECEBER}
            ) t
            GROUP BY 1
        `);
    }

    // as OS não pagas mais antigas, com o telefone do cliente para a cobrança
    async aReceberMaisAntigas(limite: number): Promise<OsAReceberLinha[]> {
        return prisma.$queryRaw<OsAReceberLinha[]>(Prisma.sql`
            SELECT
                a.id::text AS id,
                COALESCE(u.nome, a.nome_cliente) AS cliente,
                COALESCE(a.telefone, u.telefone) AS telefone,
                a.data_hora,
                (${DIAS_DESDE_A_VISITA})::int AS dias,
                (${VALOR_OS})::float8 AS valor
            FROM appointments a
            LEFT JOIN users u ON u.id = a.usuario_id
            WHERE ${OS_A_RECEBER}
            ORDER BY a.data_hora ASC
            LIMIT ${limite}::int
        `);
    }

    // OS esperando decisão da gestão e produtos ativos com estoque no limite ou abaixo dele
    async contagensOperacionais(limiteEstoque: number): Promise<ContagensOperacionais> {
        const [linha] = await prisma.$queryRaw<ContagensOperacionais[]>(Prisma.sql`
            SELECT
                (SELECT COUNT(*) FROM appointments WHERE status = 'AGUARDANDO')::int AS os_aguardando,
                (SELECT COUNT(*) FROM products WHERE ativo AND estoque <= ${limiteEstoque}::int)::int AS estoque_baixo
        `);
        return linha;
    }
}
