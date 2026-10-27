// testes realizados no authService

import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { AuthService } from "../src/service/authService";
import { UserRepository } from "../src/repository/userRepository";
import jwt from "jsonwebtoken";

// função para service e repository para os testes
function montaUsuarioService(usuario: unknown) {
    const repositorioFalso = {getByEmail: vi.fn().mockResolvedValue(usuario)};
    const service = new AuthService(repositorioFalso as unknown as UserRepository);
    return { service, repositorioFalso };
}

// função reutilizável que cria usuários para os testes
async function criaUsuario(id: string, nome: string, email: string, senha: string, perfil: 'CLIENTE' | 'ADMINISTRADOR') {
    const senhaHash = await  bcrypt.hash(senha, 4);
    const usuarioDoBanco: unknown = {
        id: id,
        nome: nome,
        email: email,
        senha: senhaHash,
        perfil: perfil,
    };
    return usuarioDoBanco;
}

describe("AuthService.execute", () => {
    // primeiro teste, dados corretos e validados
    it("devolve token e dados do usuário quando e-mail e senha estão certos", async () => {
        const usuarioDoBanco = await criaUsuario('u1', 'Gabriel', 'gabriel@teste.com', 'senha123', 'CLIENTE');
        const { service } =  montaUsuarioService(usuarioDoBanco);

        const resultado = await service.execute({email: "gabriel@teste.com", senha: "senha123"});

        expect(resultado.token).toBeTypeOf("string");
        expect(resultado.user.email).toBe("gabriel@teste.com");
        expect(resultado.user.perfil).toBe("CLIENTE");
        expect(resultado.user).not.toHaveProperty(  "senha");
    });

    // teste de recusa de senha errada, enviando código e mensagem de erro
        it("recusa senha errada com a mesma mensagem", async () => {
            const usuarioDoBanco = await criaUsuario('u1', 'Gabriel', 'gabriel@teste.com', 'senha123', 'CLIENTE');
            const { service } = montaUsuarioService(usuarioDoBanco);

            const tentativa = service.execute({email: "gabriel@teste.com", senha: "senha456"});

            await expect(tentativa).rejects.toMatchObject({statusCode: 400, message: "E-mail ou senha incorretos."});
        });

        // teste de recusa e-mail não cadastrado, com código e mensagem de erro
        it("recusa e-mail não cadastrado com 400", async () => {
            const { service } = montaUsuarioService(null);

            const tentativa = service.execute({email: 'teste@gmail.com', senha: 'senha789'});

            await expect(tentativa).rejects.toMatchObject({statusCode: 400, message: "E-mail ou senha incorretos."});
        });

        // recusa algum campo vazio, sem precisar consultar o repositório
        it("recusa campos vazios sem consultar o banco", async () => {
            const { service, repositorioFalso } = montaUsuarioService(null);

            const tentativa = service.execute({email: '', senha: 'senha123'});

            await expect(tentativa).rejects.toMatchObject({statusCode: 400, message: "E-mail ou senha incorretos."});
            expect(repositorioFalso.getByEmail).not.toHaveBeenCalled()
        });

        // normaliza (trim e lowerCase) o e-mail antes de buscar no repository
        it("normaliza o e-mail antes de buscar", async () => {
            const usuarioDoBanco = await criaUsuario('u1', 'Gabriel', 'gabriel@teste.com', 'senha123', 'CLIENTE');
            const { service, repositorioFalso } = montaUsuarioService(usuarioDoBanco);

            await service.execute({email: '  Gabriel@TESTE.com  ', senha: 'senha123'});
            expect(repositorioFalso.getByEmail).toHaveBeenCalledWith("gabriel@teste.com")
        });

        // token jwt vinculado com id e tipo de perfil do usuário
        it("o token carrega o id e o perfil do usuário", async () => {
            const usuarioDoBanco = await criaUsuario('u1', 'Gabriel', 'gabriel@teste.com', 'senha123', 'ADMINISTRADOR');
            const { service } = montaUsuarioService(usuarioDoBanco);

            const resultado = await service.execute({email: 'gabriel@teste.com', senha: 'senha123'});
            expect(jwt.verify(resultado.token, "segredo-de-teste")).toMatchObject({ id: "u1", perfil: "ADMINISTRADOR" });
        })
});