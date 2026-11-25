// testes da troca de perfil feita pelo administrador

import { afterEach, describe, expect, it, vi } from "vitest";
import { UserService } from "../src/service/userService";
import { UserRepository } from "../src/repository/userRepository";

const ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_LOGADO = "22222222-2222-4222-8222-222222222222";

function usuario(perfil: "CLIENTE" | "ADMINISTRADOR") {
    return { id: ID, nome: "Ana", email: "ana@teste.com", cpf: "12345678901", perfil };
}

function montaService(perfilAtual: "CLIENTE" | "ADMINISTRADOR" | null, totalAdmins = 2) {
    const getById = vi.spyOn(UserRepository.prototype, "getById")
        .mockResolvedValue((perfilAtual ? usuario(perfilAtual) : null) as never);
    const countAdmins = vi.spyOn(UserRepository.prototype, "countAdmins").mockResolvedValue(totalAdmins);
    const updatePerfil = vi.spyOn(UserRepository.prototype, "updatePerfil")
        .mockResolvedValue(usuario("ADMINISTRADOR") as never);

    return { service: new UserService(), getById, countAdmins, updatePerfil };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("UserService.alterarPerfil", () => {
    it("promove um cliente a administrador", async () => {
        const { service, countAdmins, updatePerfil } = montaService("CLIENTE");

        const resultado = await service.alterarPerfil(ID, { perfil: "ADMINISTRADOR" }, ADMIN_LOGADO);

        expect(resultado.perfil).toBe("ADMINISTRADOR");
        expect(updatePerfil).toHaveBeenCalledWith(ID, "ADMINISTRADOR");
        expect(countAdmins).not.toHaveBeenCalled();
    });

    it("rebaixa um administrador quando existe outro", async () => {
        const { service, updatePerfil } = montaService("ADMINISTRADOR", 2);

        await service.alterarPerfil(ID, { perfil: "CLIENTE" }, ADMIN_LOGADO);

        expect(updatePerfil).toHaveBeenCalledWith(ID, "CLIENTE");
    });

    it("recusa rebaixar o último administrador", async () => {
        const { service, updatePerfil } = montaService("ADMINISTRADOR", 1);

        const tentativa = service.alterarPerfil(ID, { perfil: "CLIENTE" }, ADMIN_LOGADO);

        await expect(tentativa).rejects.toMatchObject({
            statusCode: 409,
            message: "Não é possível rebaixar o último administrador.",
        });
        expect(updatePerfil).not.toHaveBeenCalled();
    });

    it("recusa alterar o próprio perfil", async () => {
        const { service, getById, updatePerfil } = montaService("ADMINISTRADOR");

        const tentativa = service.alterarPerfil(ID, { perfil: "CLIENTE" }, ID);

        await expect(tentativa).rejects.toMatchObject({
            statusCode: 400,
            message: "Você não pode alterar o próprio perfil.",
        });
        expect(getById).not.toHaveBeenCalled();
        expect(updatePerfil).not.toHaveBeenCalled();
    });

    it("recusa perfil fora do enum", async () => {
        const { service, getById, updatePerfil } = montaService("CLIENTE");

        const tentativa = service.alterarPerfil(ID, { perfil: "SUPERADMIN" as never }, ADMIN_LOGADO);

        await expect(tentativa).rejects.toMatchObject({ statusCode: 400 });
        expect(getById).not.toHaveBeenCalled();
        expect(updatePerfil).not.toHaveBeenCalled();
    });

    it("não grava nada quando o perfil já é o mesmo", async () => {
        const { service, updatePerfil } = montaService("ADMINISTRADOR");

        const resultado = await service.alterarPerfil(ID, { perfil: "ADMINISTRADOR" }, ADMIN_LOGADO);

        expect(resultado.perfil).toBe("ADMINISTRADOR");
        expect(updatePerfil).not.toHaveBeenCalled();
    });

    it("devolve 404 para usuário inexistente", async () => {
        const { service, updatePerfil } = montaService(null);

        const tentativa = service.alterarPerfil(ID, { perfil: "ADMINISTRADOR" }, ADMIN_LOGADO);

        await expect(tentativa).rejects.toMatchObject({ statusCode: 404 });
        expect(updatePerfil).not.toHaveBeenCalled();
    });

    it("devolve 404 para id fora do formato UUID sem consultar o banco", async () => {
        const { service, getById } = montaService("CLIENTE");

        const tentativa = service.alterarPerfil("abc", { perfil: "ADMINISTRADOR" }, ADMIN_LOGADO);

        await expect(tentativa).rejects.toMatchObject({ statusCode: 404 });
        expect(getById).not.toHaveBeenCalled();
    });
});
