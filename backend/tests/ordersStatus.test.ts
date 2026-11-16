import { afterEach, describe, expect, it, vi } from "vitest";
import { OrdersRepository } from "../src/repository/ordersRepository";
import { OrdersService } from "../src/service/ordersService";

const PEDIDO_ID = "3f2fa233-444b-4e87-a5c4-0277499c4be4";

function pedidoCom(status: string) {
    return { id: PEDIDO_ID, status } as never;
}

function prepararPedido(status: string) {
    const getById = vi.spyOn(OrdersRepository.prototype, "getById").mockResolvedValue(pedidoCom(status));
    const updateStatus = vi.spyOn(OrdersRepository.prototype, "updateStatus").mockResolvedValue(pedidoCom(status) as never);
    const cancel = vi.spyOn(OrdersRepository.prototype, "cancel").mockResolvedValue(pedidoCom("CANCELADO") as never);
    return { getById, updateStatus, cancel };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("OrdersService.updateStatus", () => {
    it("avança de PAGO para ENVIADO", async () => {
        const { updateStatus } = prepararPedido("PAGO");

        await new OrdersService().updateStatus(PEDIDO_ID, { status: "ENVIADO" });

        expect(updateStatus).toHaveBeenCalledWith(PEDIDO_ID, "PAGO", "ENVIADO");
    });

    it("avança de ENVIADO para ENTREGUE", async () => {
        const { updateStatus } = prepararPedido("ENVIADO");

        await new OrdersService().updateStatus(PEDIDO_ID, { status: "ENTREGUE" });

        expect(updateStatus).toHaveBeenCalledWith(PEDIDO_ID, "ENVIADO", "ENTREGUE");
    });

    it("não permite pular de PAGO para ENTREGUE", async () => {
        const { updateStatus } = prepararPedido("PAGO");

        const tentativa = new OrdersService().updateStatus(PEDIDO_ID, { status: "ENTREGUE" });

        await expect(tentativa).rejects.toMatchObject({ statusCode: 409 });
        expect(updateStatus).not.toHaveBeenCalled();
    });

    it("não permite avançar um pedido já entregue", async () => {
        const { updateStatus } = prepararPedido("ENTREGUE");

        const tentativa = new OrdersService().updateStatus(PEDIDO_ID, { status: "ENVIADO" });

        await expect(tentativa).rejects.toMatchObject({ statusCode: 409 });
        expect(updateStatus).not.toHaveBeenCalled();
    });

    it.each(["PENDENTE", "PAGO", "ENVIADO"])("cancela um pedido %s", async (status) => {
        const { cancel } = prepararPedido(status);

        await new OrdersService().updateStatus(PEDIDO_ID, { status: "CANCELADO" });

        expect(cancel).toHaveBeenCalledWith(PEDIDO_ID);
    });

    it.each(["ENTREGUE", "CANCELADO"])("não cancela um pedido %s", async (status) => {
        const { cancel } = prepararPedido(status);

        const tentativa = new OrdersService().updateStatus(PEDIDO_ID, { status: "CANCELADO" });

        await expect(tentativa).rejects.toMatchObject({ statusCode: 409 });
        expect(cancel).not.toHaveBeenCalled();
    });

    it("recusa um status fora do fluxo", async () => {
        const { getById } = prepararPedido("PAGO");

        const tentativa = new OrdersService().updateStatus(PEDIDO_ID, { status: "PAGO" });

        await expect(tentativa).rejects.toMatchObject({ statusCode: 400 });
        expect(getById).not.toHaveBeenCalled();
    });

    it("recusa um id inválido sem consultar o repositório", async () => {
        const { getById } = prepararPedido("PAGO");

        const tentativa = new OrdersService().updateStatus("id-invalido", { status: "ENVIADO" });

        await expect(tentativa).rejects.toMatchObject({ statusCode: 404 });
        expect(getById).not.toHaveBeenCalled();
    });

    it("devolve 404 quando o pedido não existe", async () => {
        vi.spyOn(OrdersRepository.prototype, "getById").mockResolvedValue(null);

        const tentativa = new OrdersService().updateStatus(PEDIDO_ID, { status: "ENVIADO" });

        await expect(tentativa).rejects.toMatchObject({ statusCode: 404 });
    });
});
