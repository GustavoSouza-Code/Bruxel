import { afterEach, describe, expect, it, vi } from "vitest";
import { AppointmentsRepository } from "../src/repository/appointmentsRepository";
import { AppointmentsService } from "../src/service/appointmentsService";
import type { UsuarioAutenticado } from "../src/models/user";

const CLIENTE: UsuarioAutenticado = {
    id: "u1",
    nome: "Ana Souza",
    email: "ana@teste.com",
    perfil: "CLIENTE",
};

const atendimentoDoBanco = {
    id: "3f2a9c1b-0000-4000-8000-000000000001",
    usuario_id: "u1",
    status: "CONCLUIDO",
    valor_mao_de_obra: "150.00",
    observacoes_tecnico: "Troquei o capacitor.",
    pago_em: null,
    itens: [
        {
            produto_id: "p1",
            quantidade: 2,
            preco_unitario: "21.50",
            products: { id: "p1", nome: "Hidrofloc 1L" },
        },
    ],
};

describe("AppointmentsService para o cliente", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("calcula o total e não devolve a mão de obra separada", async () => {
        vi.spyOn(AppointmentsRepository.prototype, "getAllByUsuario").mockResolvedValue([
            atendimentoDoBanco,
        ] as never);

        const resultado = await new AppointmentsService().getAll(CLIENTE, undefined);
        const publico = resultado[0] as unknown as Record<string, unknown>;

        expect(publico.valor_total).toBe("193.00");
        expect(publico).not.toHaveProperty("valor_mao_de_obra");
        expect(publico).not.toHaveProperty("observacoes_tecnico");
        expect(publico).not.toHaveProperty("pago_em");
    });
});
