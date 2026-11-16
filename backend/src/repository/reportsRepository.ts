import { prisma } from "../database/prisma";
import { FiltrosRelatorioAtendimentos, FiltrosRelatorioPedidos } from "../models/report";

// acesso ao banco para os relatórios; o limite evita montar um arquivo gigante
export class ReportsRepository {

    // pedidos da loja no período, do mais recente para o mais antigo
    async getPedidos(filtros: FiltrosRelatorioPedidos, limite: number) {
        return prisma.orders.findMany({
            where: {
                criado_em: { gte: filtros.inicio, lt: filtros.fimExclusivo },
                status: filtros.status,
            },
            orderBy: { criado_em: "desc" },
            take: limite,
            include: { users: { select: { nome: true } } },
        });
    }

    // atendimentos pela data da visita; "a-receber" é a OS concluída ainda sem pagamento
    async getAtendimentos(filtros: FiltrosRelatorioAtendimentos, limite: number) {
        return prisma.appointments.findMany({
            where: {
                data_hora: { gte: filtros.inicio, lt: filtros.fimExclusivo },
                status: filtros.status,
                pago_em: filtros.pagamento === "pago" ? { not: null } : filtros.pagamento === "a-receber" ? null : undefined,
            },
            orderBy: { data_hora: "desc" },
            take: limite,
            include: {
                cliente: { select: { nome: true } },
                itens: { select: { quantidade: true, preco_unitario: true } },
            },
        });
    }
}
