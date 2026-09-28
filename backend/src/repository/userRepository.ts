import {UpdateUserDTO, CreateUserDTO} from "../models/user";
import {prisma} from '../database/prisma';

// lógica de interação com o banco de dados utilizando PrismaORM
// CRUD completo

export class UserRepository {

    async create(user: CreateUserDTO) {
        return prisma.users.create({
            data: user
        });
    }

    async getAll() {
        try {
            const users = await prisma.users.findMany();
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
                }
            })
            return users;
        } catch (error) {
            console.error(`Erro ao buscar usuário: ${id}:`, error);
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
            const updateUser = await prisma.users.update({
                where: {
                    id: id,
                },
                data: data
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
                }
            });
            return deleteUser;
        } catch (error) {
            console.error(`Erro ao deletar usuário: ${id}:`, error);
            throw error;
        }
    }

}