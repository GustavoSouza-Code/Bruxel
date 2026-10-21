import { prisma } from "../database/prisma";
import { AppError } from "../errors/AppError";
import { DadosPedido, ItemPedidoComPreco } from "../models/order";

// itens e nome do produto devolvidos em toda listagem de pedidos
const incluirItensDoPedido = {
    order_items: {
        include: {
            products: { select: { nome: true } },
        },
    },
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
                include: incluirItensDoPedido,
            });
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            throw error;
        }
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
