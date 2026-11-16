import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, txMock } = vi.hoisted(() => {
    const txMock = {
        orders: {
            updateMany: vi.fn(),
            findUnique: vi.fn(),
            findUniqueOrThrow: vi.fn(),
        },
        products: {
            update: vi.fn(),
        },
    };
    const prismaMock = {
        orders: {
            updateMany: vi.fn(),
            findUnique: vi.fn(),
            findUniqueOrThrow: vi.fn(),
        },
        $transaction: vi.fn(),
    };
    return { prismaMock, txMock };
});

vi.mock("../src/database/prisma", () => ({ prisma: prismaMock }));

import { OrdersRepository } from "../src/repository/ordersRepository";

const PEDIDO_ID = "3f2fa233-444b-4e87-a5c4-0277499c4be4";

const pedidoCancelado = {
    id: PEDIDO_ID,
    status: "CANCELADO",
    order_items: [
        { produto_id: "p2", quantidade: 1 },
        { produto_id: "p1", quantidade: 2 },
    ],
};

function prepararTransacao() {
    prismaMock.$transaction.mockImplementation((callback: (tx: typeof txMock) => unknown) =>
        callback(txMock)
    );
    txMock.products.update.mockResolvedValue({});
}

beforeEach(() => {
    vi.clearAllMocks();
    prepararTransacao();
});

describe("OrdersRepository.updateStatus", () => {
    it("atualiza apenas quando o status atual ainda é o esperado", async () => {
        prismaMock.orders.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.orders.findUniqueOrThrow.mockResolvedValue({ id: PEDIDO_ID, status: "ENVIADO" });

        await new OrdersRepository().updateStatus(PEDIDO_ID, "PAGO", "ENVIADO");

        expect(prismaMock.orders.updateMany).toHaveBeenCalledWith({
            where: { id: PEDIDO_ID, status: "PAGO" },
            data: { status: "ENVIADO", atualizado_em: expect.any(Date) },
        });
    });

    it("devolve 409 quando outro admin já alterou o status", async () => {
        prismaMock.orders.updateMany.mockResolvedValue({ count: 0 });

        const tentativa = new OrdersRepository().updateStatus(PEDIDO_ID, "PAGO", "ENVIADO");

        await expect(tentativa).rejects.toMatchObject({ statusCode: 409 });
    });
});

describe("OrdersRepository.cancel", () => {
    it("cancela e devolve ao estoque na ordem dos produtos", async () => {
        txMock.orders.updateMany.mockResolvedValue({ count: 1 });
        txMock.orders.findUniqueOrThrow.mockResolvedValue(pedidoCancelado);

        await new OrdersRepository().cancel(PEDIDO_ID);

        expect(txMock.orders.updateMany).toHaveBeenCalledWith({
            where: { id: PEDIDO_ID, status: { in: ["PENDENTE", "PAGO", "ENVIADO"] } },
            data: { status: "CANCELADO", atualizado_em: expect.any(Date) },
        });
        expect(txMock.products.update).toHaveBeenNthCalledWith(1, {
            where: { id: "p1" },
            data: { estoque: { increment: 2 } },
        });
        expect(txMock.products.update).toHaveBeenNthCalledWith(2, {
            where: { id: "p2" },
            data: { estoque: { increment: 1 } },
        });
    });

    it("não devolve o estoque ao tentar cancelar duas vezes", async () => {
        txMock.orders.updateMany
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 0 });
        txMock.orders.findUniqueOrThrow.mockResolvedValue(pedidoCancelado);
        txMock.orders.findUnique.mockResolvedValue({ status: "CANCELADO" });

        const repository = new OrdersRepository();
        await repository.cancel(PEDIDO_ID);
        const segundaTentativa = repository.cancel(PEDIDO_ID);

        await expect(segundaTentativa).rejects.toMatchObject({ statusCode: 409 });
        expect(txMock.products.update).toHaveBeenCalledTimes(2);
    });

    it("em cancelamentos simultâneos, só uma transação devolve o estoque", async () => {
        txMock.orders.updateMany
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 0 });
        txMock.orders.findUniqueOrThrow.mockResolvedValue(pedidoCancelado);
        txMock.orders.findUnique.mockResolvedValue({ status: "CANCELADO" });

        const repository = new OrdersRepository();
        const resultados = await Promise.allSettled([
            repository.cancel(PEDIDO_ID),
            repository.cancel(PEDIDO_ID),
        ]);

        expect(resultados.filter((resultado) => resultado.status === "fulfilled")).toHaveLength(1);
        expect(resultados.filter((resultado) => resultado.status === "rejected")).toHaveLength(1);
        expect(txMock.products.update).toHaveBeenCalledTimes(2);
    });

    it("devolve 404 quando o pedido não existe", async () => {
        txMock.orders.updateMany.mockResolvedValue({ count: 0 });
        txMock.orders.findUnique.mockResolvedValue(null);

        const tentativa = new OrdersRepository().cancel(PEDIDO_ID);

        await expect(tentativa).rejects.toMatchObject({ statusCode: 404 });
        expect(txMock.products.update).not.toHaveBeenCalled();
    });
});
