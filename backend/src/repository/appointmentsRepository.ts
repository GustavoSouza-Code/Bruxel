import { prisma } from "../database/prisma";
import { AppError } from "../errors/AppError";
import { Prisma } from "../generated/prisma/client";
import { status_agendamento } from "../generated/prisma/enums";
import {
    DadosCriacaoAtendimento,
    FiltrosAtendimento,
    ItemOsComPreco,
} from "../models/appointment";

// dados do cliente/técnico e itens usados em toda consulta de OS
const incluirRelacionamentos = {
    cliente: { select: { id: true, nome: true } },
    tecnico: { select: { id: true, nome: true } },
    itens: {
        include: {
            products: { select: { id: true, nome: true } },
        },
    },
} as const;

const ordenarPorCriacao = { criado_em: "desc" } as const;

// situações que não ocupam mais o horário do técnico
const STATUS_LIVRES: status_agendamento[] = ["DISPONIVEL", "CANCELADO", "RECUSADO"];

// acesso ao banco para os atendimentos/ordens de serviço
export class AppointmentsRepository {

    // grava o pedido já validado pelo service
    async create(dados: DadosCriacaoAtendimento) {
        return prisma.appointments.create({
            data: dados,
            include: incluirRelacionamentos,
        });
    }

    // listagem geral usada pela gestão
    async getAll(filtros: FiltrosAtendimento) {
        return prisma.appointments.findMany({
            where: this.montarFiltros(filtros),
            orderBy: ordenarPorCriacao,
            include: incluirRelacionamentos,
        });
    }

    // histórico do cliente autenticado
    async getAllByUsuario(usuarioId: string, filtros: FiltrosAtendimento) {
        return prisma.appointments.findMany({
            where: {
                usuario_id: usuarioId,
                ...this.montarFiltros(filtros),
            },
            orderBy: ordenarPorCriacao,
            include: incluirRelacionamentos,
        });
    }

    async getById(id: string) {
        return prisma.appointments.findUnique({
            where: { id },
            include: incluirRelacionamentos,
        });
    }

    // impede dois atendimentos no mesmo horário com o mesmo técnico
    async getConflitoDeHorario(tecnicoId: string, dataHora: Date) {
        return prisma.appointments.findFirst({
            where: {
                tecnico_id: tecnicoId,
                data_hora: dataHora,
                status: { notIn: STATUS_LIVRES },
            },
            select: { id: true },
        });
    }

    async updateStatus(id: string, status: status_agendamento, mensagemCliente?: string | null) {
        return prisma.appointments.update({
            where: { id },
            data: {
                status,
                ...(mensagemCliente !== undefined ? { mensagem_cliente: mensagemCliente } : {}),
            },
            include: incluirRelacionamentos,
        });
    }

    /**
     * Conclui a OS e baixa o estoque dos itens na mesma transação.
     *
     * O updateMany condicional garante que só uma requisição consiga fazer a
     * transição. Se algum produto não tiver saldo, o erro desfaz também o status.
     */
    async concluirComBaixaDeEstoque(id: string) {
        return prisma.$transaction(async (tx) => {
            const transicao = await tx.appointments.updateMany({
                where: { id, status: "EM_ANDAMENTO" },
                data: { status: "CONCLUIDO" },
            });

            if (transicao.count === 0) {
                throw new AppError(409, "A ordem não está mais em andamento.");
            }

            const itens = await tx.appointment_items.findMany({
                where: { appointment_id: id },
                select: { produto_id: true, quantidade: true },
            });

            // ordenar evita deadlock com outras baixas que usam os mesmos produtos
            const itensOrdenados = [...itens].sort((a, b) => a.produto_id.localeCompare(b.produto_id));

            for (const item of itensOrdenados) {
                const baixou = await tx.products.updateMany({
                    where: {
                        id: item.produto_id,
                        estoque: { gte: item.quantidade },
                    },
                    data: {
                        estoque: { decrement: item.quantidade },
                    },
                });

                if (baixou.count === 0) {
                    const produto = await tx.products.findUnique({
                        where: { id: item.produto_id },
                        select: { nome: true, estoque: true },
                    });
                    if (!produto) {
                        throw new AppError(404, `Produto não encontrado: ${item.produto_id}.`);
                    }
                    throw new AppError(
                        409,
                        `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}.`
                    );
                }
            }

            return tx.appointments.findUniqueOrThrow({
                where: { id },
                include: incluirRelacionamentos,
            });
        });
    }

    /**
     * Atualiza a OS e, quando os itens são enviados, substitui a lista inteira.
     * Tudo numa transação para não deixar a OS sem itens se a gravação falhar.
     */
    async updateOs(
        id: string,
        dados: { observacoes_tecnico?: string | null; valor_mao_de_obra?: string | null },
        itens?: ItemOsComPreco[]
    ) {
        return prisma.$transaction(async (tx) => {
            if (itens !== undefined) {
                // trava a linha e confirma o status dentro da transação, evitando
                // trocar itens enquanto a OS é concluída por outra requisição
                const emAndamento = await tx.appointments.updateMany({
                    where: { id, status: "EM_ANDAMENTO" },
                    data: { atualizado_em: new Date() },
                });
                if (emAndamento.count === 0) {
                    throw new AppError(409, "Os produtos da OS não podem mais ser alterados.");
                }

                await tx.appointment_items.deleteMany({ where: { appointment_id: id } });

                if (itens.length > 0) {
                    await tx.appointment_items.createMany({
                        data: itens.map((item) => ({
                            appointment_id: id,
                            produto_id: item.produto_id,
                            quantidade: item.quantidade,
                            preco_unitario: item.preco_unitario,
                        })),
                    });
                }
            }

            await tx.appointments.update({ where: { id }, data: dados });

            return tx.appointments.findUniqueOrThrow({
                where: { id },
                include: incluirRelacionamentos,
            });
        });
    }

    async marcarPago(id: string) {
        return prisma.appointments.update({
            where: { id },
            data: { pago_em: new Date() },
            include: incluirRelacionamentos,
        });
    }

    private montarFiltros(filtros: FiltrosAtendimento): Prisma.appointmentsWhereInput {
        return {
            ...(filtros.status ? { status: filtros.status } : {}),
            ...(filtros.tecnico_id ? { tecnico_id: filtros.tecnico_id } : {}),
        };
    }
}
