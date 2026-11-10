import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/database/prisma";
import { OrdersRepository } from "../src/repository/ordersRepository";

vi.mock("../src/database/prisma", () => ({
    prisma: {
        orders: {
            findMany: vi.fn(),
        },
    },
}));

const findMany = vi.mocked(prisma.orders.findMany);

const incluirItensDoPedido = {
    order_items: {
        include: {
            products: { select: { nome: true } },
        },
    },
};

describe("OrdersRepository", () => {
    beforeEach(() => {
        findMany.mockReset();
        findMany.mockResolvedValue([] as never);
    });

    it("inclui o cliente na listagem do admin", async () => {
        await new OrdersRepository().getAll();

        expect(findMany).toHaveBeenCalledWith({
            orderBy: { criado_em: "desc" },
            include: {
                ...incluirItensDoPedido,
                users: { select: { nome: true, email: true } },
            },
        });
    });

    it("mantém a listagem do cliente sem os dados do usuário", async () => {
        await new OrdersRepository().getAllByUsuario("u1");

        expect(findMany).toHaveBeenCalledWith({
            where: { usuario_id: "u1" },
            orderBy: { criado_em: "desc" },
            include: incluirItensDoPedido,
        });
    });
});
