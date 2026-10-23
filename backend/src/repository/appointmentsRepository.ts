import { prisma } from "../database/prisma";
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
