import { prisma } from "../database/prisma";
import { AppError } from "../errors/AppError";
import { status_pedido } from "../generated/prisma/enums";
import { DadosPedido, ItemPedidoComPreco, STATUS_CANCELAVEIS } from "../models/order";

// itens e nome do produto devolvidos em toda listagem de pedidos
const incluirItensDoPedido = {
    order_items: {
        include: {
            products: { select: { nome: true } },
        },
    },
} as const;

// o admin precisa identificar o cliente sem buscar a lista inteira de usuários
const incluirClienteDoPedido = {
    users: { select: { nome: true, email: true } },
} as const;

const incluirPedidoDoAdmin = {
    ...incluirItensDoPedido,
    ...incluirClienteDoPedido,
} as const;

const ordenarPorCriacao = { criado_em: "desc" } as const;

// interação com orders/order_items e com o estoque dos produtos
export class OrdersRepository {

    /**
     * Cria o pedido e dá baixa no estoque numa única transação.
     *
     * O updateMany com "estoque >= quantidade" é a trava contra compras
     * simultâneas: se duas pessoas tentarem levar a última unidade, o banco
     * deixa só uma atualizar. Se qualquer item falhar, a transação inteira é
     * desfeita e o estoque dos itens anteriores volta ao normal.
     */
    async create(usuarioId: string, dados: DadosPedido, itens: ItemPedidoComPreco[], valorTotal: string) {
        // ordenar evita deadlock quando dois pedidos têm os mesmos produtos em ordens diferentes
        const itensOrdenados = [...itens].sort((a, b) => a.produto_id.localeCompare(b.produto_id));

        try {
            return await prisma.$transaction(async (tx) => {
                for (const item of itensOrdenados) {
                    const resultado = await tx.products.updateMany({
                        where: {
                            id: item.produto_id,
                            ativo: true,
                            estoque: { gte: item.quantidade },
                        },
                        data: {
                            estoque: { decrement: item.quantidade },
                        },
                    });

                    if (resultado.count === 0) {
                        // descobre o motivo real da recusa para a mensagem de erro
                        const produto = await tx.products.findUnique({
                            where: { id: item.produto_id },
                            select: { nome: true, estoque: true, ativo: true },
                        });
                        if (!produto) {
                            throw new AppError(404, `Produto não encontrado: ${item.produto_id}.`);
                        }
                        if (!produto.ativo) {
                            throw new AppError(409, `Produto indisponível: ${produto.nome}.`);
                        }
                        throw new AppError(
                            409,
                            `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}.`
                        );
                    }
                }

                return await tx.orders.create({
                    data: {
                        usuario_id: usuarioId,
                        status: dados.status,
                        forma_pagamento: dados.forma_pagamento,
                        endereco_entrega: dados.endereco_entrega,
                        valor_frete: 0,
                        valor_total: valorTotal,
                        order_items: {
                            create: itens.map((item) => ({
                                produto_id: item.produto_id,
                                quantidade: item.quantidade,
                                preco_unitario: item.preco_unitario,
                            })),
                        },
                    },
                    include: incluirItensDoPedido,
                });
            });
        } catch (error) {
            console.error(`Erro ao criar pedido do usuário ${usuarioId}:`, error);
            throw error;
        }
    }

    // listagem geral usada pelo admin
    async getAll() {
        try {
            return await prisma.orders.findMany({
                orderBy: ordenarPorCriacao,
                include: incluirPedidoDoAdmin,
            });
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            throw error;
        }
    }

    async getById(id: string) {
        return prisma.orders.findUnique({
            where: { id },
            include: incluirPedidoDoAdmin,
        });
    }

    async updateStatus(id: string, statusAtual: status_pedido, novoStatus: status_pedido) {
        const resultado = await prisma.orders.updateMany({
            where: { id, status: statusAtual },
            data: { status: novoStatus, atualizado_em: new Date() },
        });

        if (resultado.count === 0) {
            throw new AppError(409, "O status do pedido mudou. Atualize a página e tente novamente.");
        }

        return prisma.orders.findUniqueOrThrow({
            where: { id },
            include: incluirPedidoDoAdmin,
        });
    }

    /**
     * O update condicional garante que dois cancelamentos simultâneos não
     * devolvam o estoque duas vezes. Só quem conseguiu mudar o status incrementa.
     */
    async cancel(id: string) {
        return prisma.$transaction(async (tx) => {
            const resultado = await tx.orders.updateMany({
                where: { id, status: { in: STATUS_CANCELAVEIS } },
                data: { status: "CANCELADO", atualizado_em: new Date() },
            });

            if (resultado.count === 0) {
                const pedido = await tx.orders.findUnique({
                    where: { id },
                    select: { status: true },
                });
                if (!pedido) {
                    throw new AppError(404, "Pedido não encontrado.");
                }
                throw new AppError(409, "Este pedido não pode ser cancelado.");
            }

            const pedido = await tx.orders.findUniqueOrThrow({
                where: { id },
                include: incluirPedidoDoAdmin,
            });

            const itensOrdenados = [...pedido.order_items].sort((a, b) =>
                a.produto_id.localeCompare(b.produto_id)
            );
            for (const item of itensOrdenados) {
                await tx.products.update({
                    where: { id: item.produto_id },
                    data: { estoque: { increment: item.quantidade } },
                });
            }

            return pedido;
        });
    }

    // listagem do cliente autenticado
    async getAllByUsuario(usuarioId: string) {
        try {
            return await prisma.orders.findMany({
                where: { usuario_id: usuarioId },
                orderBy: ordenarPorCriacao,
                include: incluirItensDoPedido,
            });
        } catch (error) {
            console.error(`Erro ao buscar pedidos do usuário ${usuarioId}:`, error);
            throw error;
        }
    }
}
