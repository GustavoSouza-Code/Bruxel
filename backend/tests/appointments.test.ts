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
    foto_url: null,
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

const FOTO_ANTIGA = "https://bruxel.exemplo.com/api/uploads/atendimentos/11111111-1111-4111-8111-111111111111.png";
const FOTO_NOVA = "https://bruxel.exemplo.com/api/uploads/atendimentos/22222222-2222-4222-8222-222222222222.png";

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

    it("cliente dono troca a foto e recebe a anterior para limpeza", async () => {
        vi.spyOn(AppointmentsRepository.prototype, "getById").mockResolvedValue({
            ...atendimentoDoBanco,
            foto_url: FOTO_ANTIGA,
        } as never);
        const atualizar = vi.spyOn(AppointmentsRepository.prototype, "updateFoto").mockResolvedValue({
            foto_url: FOTO_NOVA,
        });

        const resultado = await new AppointmentsService().trocarImagem(
            CLIENTE,
            atendimentoDoBanco.id,
            FOTO_NOVA
        );

        expect(resultado).toEqual({ foto_url: FOTO_NOVA, foto_anterior: FOTO_ANTIGA });
        expect(atualizar).toHaveBeenCalledWith(atendimentoDoBanco.id, FOTO_NOVA);
    });

    it("administrador também pode trocar a foto de qualquer OS", async () => {
        vi.spyOn(AppointmentsRepository.prototype, "getById").mockResolvedValue({
            ...atendimentoDoBanco,
            foto_url: FOTO_ANTIGA,
        } as never);
        const atualizar = vi.spyOn(AppointmentsRepository.prototype, "updateFoto").mockResolvedValue({
            foto_url: FOTO_NOVA,
        });

        const resultado = await new AppointmentsService().trocarImagem(
            { ...CLIENTE, id: "admin", perfil: "ADMINISTRADOR" },
            atendimentoDoBanco.id,
            FOTO_NOVA
        );

        expect(resultado.foto_url).toBe(FOTO_NOVA);
        expect(atualizar).toHaveBeenCalled();
    });

    it("outro cliente não troca a foto", async () => {
        vi.spyOn(AppointmentsRepository.prototype, "getById").mockResolvedValue(atendimentoDoBanco as never);
        const atualizar = vi.spyOn(AppointmentsRepository.prototype, "updateFoto");

        await expect(
            new AppointmentsService().trocarImagem({ ...CLIENTE, id: "u2" }, atendimentoDoBanco.id, FOTO_NOVA)
        ).rejects.toMatchObject({ statusCode: 403 });

        expect(atualizar).not.toHaveBeenCalled();
    });

    it("recusa link externo no lugar de uma imagem enviada", async () => {
        vi.spyOn(AppointmentsRepository.prototype, "getById").mockResolvedValue(atendimentoDoBanco as never);
        const atualizar = vi.spyOn(AppointmentsRepository.prototype, "updateFoto");

        await expect(
            new AppointmentsService().trocarImagem(CLIENTE, atendimentoDoBanco.id, "https://exemplo.com/foto.jpg")
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(atualizar).not.toHaveBeenCalled();
    });
});
