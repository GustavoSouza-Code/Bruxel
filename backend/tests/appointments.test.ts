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

const PEDIDO = {
    tipo: "LIMPEZA" as const,
    descricao: "Limpeza completa da piscina.",
    data_hora: "2026-10-20T11:00:00.000Z",
};

describe("AppointmentsService reservas", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("cliente não reserva um horário que já tem atendimento ativo", async () => {
        const conflito = vi
            .spyOn(AppointmentsRepository.prototype, "getConflitoNoHorario")
            .mockResolvedValue({ id: "outro" } as never);
        const criar = vi.spyOn(AppointmentsRepository.prototype, "create");

        await expect(new AppointmentsService().create(CLIENTE, PEDIDO)).rejects.toMatchObject({
            statusCode: 409,
            message: "Esse horário já foi reservado. Escolha outro.",
            detalhes: [{ campo: "data_hora", mensagem: "Esse horário já foi reservado. Escolha outro." }],
        });

        expect(conflito).toHaveBeenCalledWith(new Date(PEDIDO.data_hora));
        expect(criar).not.toHaveBeenCalled();
    });

    it("cliente reserva quando o horário está livre", async () => {
        const conflito = vi
            .spyOn(AppointmentsRepository.prototype, "getConflitoNoHorario")
            .mockResolvedValue(null);
        vi.spyOn(AppointmentsRepository.prototype, "create").mockResolvedValue(
            atendimentoDoBanco as never
        );

        await expect(new AppointmentsService().create(CLIENTE, PEDIDO)).resolves.toBeDefined();
        expect(conflito).toHaveBeenCalled();
    });

    it("administrador pode encaixar um horário já ocupado", async () => {
        const conflito = vi.spyOn(AppointmentsRepository.prototype, "getConflitoNoHorario");
        const criar = vi
            .spyOn(AppointmentsRepository.prototype, "create")
            .mockResolvedValue(atendimentoDoBanco as never);

        await new AppointmentsService().create({ ...CLIENTE, perfil: "ADMINISTRADOR" }, PEDIDO);

        expect(conflito).not.toHaveBeenCalled();
        expect(criar).toHaveBeenCalled();
    });
});

describe("AppointmentsService horários ocupados", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const INICIO = new Date("2026-10-20T03:00:00.000Z");
    const FIM = new Date("2026-10-21T03:00:00.000Z");

    it("devolve os horários ativos do intervalo em ISO", async () => {
        const buscar = vi
            .spyOn(AppointmentsRepository.prototype, "getHorariosOcupados")
            .mockResolvedValue([new Date(PEDIDO.data_hora)] as never);

        const resultado = await new AppointmentsService().listarHorariosOcupados({
            inicio: INICIO.toISOString(),
            fim: FIM.toISOString(),
        });

        expect(resultado).toEqual({ horarios: [PEDIDO.data_hora] });
        expect(buscar).toHaveBeenCalledWith(INICIO, FIM);
    });

    it("recusa intervalo invertido", async () => {
        await expect(
            new AppointmentsService().listarHorariosOcupados({
                inicio: FIM.toISOString(),
                fim: INICIO.toISOString(),
            })
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("recusa intervalo maior que 31 dias", async () => {
        await expect(
            new AppointmentsService().listarHorariosOcupados({
                inicio: "2026-10-01T00:00:00.000Z",
                fim: "2026-11-02T00:00:00.000Z",
            })
        ).rejects.toMatchObject({ statusCode: 400 });
    });
});

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
