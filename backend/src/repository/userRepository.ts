import { CreateUserDTO, UpdateUserDTO } from "../models/user";
import { prisma } from "../database/prisma";
import bcrypt from "bcrypt";

// campos que podem sair da API
const camposPublicosUsuario = {
    id: true, nome: true, email: true, cpf: true, telefone: true, rua: true, numero: true,
    bairro: true, cidade: true, estado: true, cep: true, perfil: true, criado_em: true, atualizado_em: true,
} as const;

// campos necessários para conferir a senha no login
const camposLogin = {
    id: true, nome: true, email: true, senha: true, perfil: true,
} as const;

// acesso ao banco para usuários; as consultas públicas não devolvem a senha
export class UserRepository {

    // gera o hash da senha antes de salvar
    async create(user: CreateUserDTO) {
        const senhaHash = await bcrypt.hash(user.senha, 10);
        return prisma.users.create({
            data: { ...user, senha: senhaHash },
            select: camposPublicosUsuario,
        });
    }

    // listagem restrita ao admin
    async getAll() {
        try {
            return await prisma.users.findMany({ select: camposPublicosUsuario });
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            return await prisma.users.findUnique({
                where: { id },
                select: camposPublicosUsuario,
            });
        } catch (error) {
            console.error(`Erro ao buscar usuário: ${id}:`, error);
            throw error;
        }
    }

    // conferir a senha atual antes de trocar a senha
    async getSenhaById(id: string) {
        try {
            const user = await prisma.users.findUnique({
                where: { id },
                select: { senha: true },
            });
            return user?.senha ?? null;
        } catch (error) {
            console.error(`Erro ao buscar senha do usuário: ${id}:`, error);
            throw error;
        }
    }

    // usado para verificar se já existe usuário com o mesmo CPF
    async getByCPF(cpf: string) {
        try {
            return await prisma.users.findUnique({
                where: { cpf },
                select: { id: true },
            });
        } catch (error) {
            console.error(`Erro ao buscar usuário: ${cpf}:`, error);
            throw error;
        }
    }

    // usado no cadastro (duplicidade) e no login (senha)
    async getByEmail(email: string) {
        try {
            return await prisma.users.findUnique({
                where: { email },
                select: camposLogin,
            });
        } catch (error) {
            console.error(`Erro ao buscar usuário: ${email}:`, error);
            throw error;
        }
    }

    // atualização: troca a senha por hash se ela vier no corpo
    async update(id: string, data: UpdateUserDTO) {
        try {
            const dadosParaAtualizar = { ...data };

            // !== undefined (e não só truthy) pra senha nunca ir pro banco sem hash
            if (dadosParaAtualizar.senha !== undefined) {
                dadosParaAtualizar.senha = await bcrypt.hash(dadosParaAtualizar.senha, 10);
            }

            return await prisma.users.update({
                where: { id },
                data: dadosParaAtualizar,
                select: camposPublicosUsuario,
            });
        } catch (error) {
            console.error(`Erro ao atualizar usuário: ${id}:`, error);
            throw error;
        }
    }

    async delete(id: string) {
        try {
            return await prisma.users.delete({
                where: { id },
                select: camposPublicosUsuario,
            });
        } catch (error) {
            console.error(`Erro ao deletar usuário: ${id}:`, error);
            throw error;
        }
    }
}
