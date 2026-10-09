import {UpdateUserDTO, CreateUserDTO} from "../models/user";
import {prisma} from '../database/prisma';
import bcrypt from 'bcrypt';

// lógica de interação com o banco de dados utilizando PrismaORM
// CRUD completo

export const camposPublicosUsuario = {
    id: true, nome: true, email: true, cpf: true, telefone: true, rua: true, numero: true,
    bairro: true, cidade: true, estado: true, cep: true, perfil: true, criado_em: true, atualizado_em: true
} as const;

export class UserRepository {

    async create(user: CreateUserDTO) {
        const senhaHash = await bcrypt.hash(user.senha, 10);
        return prisma.users.create({
            data: {
                ...user,
                senha: senhaHash
            },
            select: camposPublicosUsuario
        });
    }

    async getAll() {
        try {
            const users = await prisma.users.findMany({
                select: camposPublicosUsuario
            });
            return users;
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            const users = await prisma.users.findUnique({
                where: {
                    id: id,
                },
                select: camposPublicosUsuario
            })
            return users;
        } catch (error) {
            console.error(`Erro ao buscar usuário: ${id}:`, error);
            throw error;
        }
    }

    // GET necessário para conferir a senha atual antes de trocar a senha
    async getSenhaById(id: string) {
        try {
            const user = await prisma.users.findUnique({
                where: {
                    id: id,
                },
                select: {senha: true}
            })
            return user?.senha ?? null;
        } catch (error) {
            console.error(`Erro ao buscar senha do usuário: ${id}:`, error);
            throw error;
        }
    }

    // GET necessário para verificar se usuário com o mesmo CPF já existe no banco
    async getByCPF(cpf: string) {
        try {
            const users = await prisma.users.findUnique({
                where: {
                    cpf: cpf,
                }
            })
            return users;
        } catch (error) {
            console.error(`Erro ao buscar usuário: ${cpf}:`, error);
            throw error;
        }
    }

    // GET necessário para verificar se usuário com o mesmo E-mail já existe no banco
    async getByEmail(email: string) {
        try {
            const users = await prisma.users.findUnique({
                where: {
                    email: email,
                }
            })
            return users;
        } catch (error) {
            console.error(`Erro ao buscar usuário: ${email}:`, error);
            throw error;
        }
    }

    async update(id: string, data: UpdateUserDTO) {
        try {
            const dadosParaAtualizar = { ...data };

            // !== undefined (e não só truthy) pra senha nunca ir pro banco sem hash
            if (dadosParaAtualizar.senha !== undefined) {
                dadosParaAtualizar.senha = await bcrypt.hash(dadosParaAtualizar.senha, 10);
            }

            const updateUser = await prisma.users.update({
                where: { id: id },
                data: dadosParaAtualizar,
                select: camposPublicosUsuario
            });
            return updateUser;
        } catch (error) {
            console.error(`Erro ao atualizar usuário: ${id}:`, error);
            throw error;
        }
    }

    async delete(id: string) {
        try {
            const deleteUser = await prisma.users.delete({
                where: {
                    id: id,
                },
                select: camposPublicosUsuario
            });
            return deleteUser;
        } catch (error) {
            console.error(`Erro ao deletar usuário: ${id}:`, error);
            throw error;
        }
    }

}