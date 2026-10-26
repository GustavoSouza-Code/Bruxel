import { CreateCategoryDTO, UpdateCategoryDTO } from "../models/category";
import { prisma } from "../database/prisma";

const camposCategoria = { id: true, nome: true } as const;

// acesso ao banco para o CRUD de categorias
export class CategoriesRepository {

    async getAll() {
        try {
            return await prisma.categories.findMany({
                select: camposCategoria,
                orderBy: { nome: "asc" },
            });
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
            throw error;
        }
    }

    // usado pelo ProductsService e pela consulta de uma categoria
    async getById(id: string) {
        try {
            return await prisma.categories.findUnique({
                where: { id },
                select: camposCategoria,
            });
        } catch (error) {
            console.error(`Erro ao buscar categoria: ${id}:`, error);
            throw error;
        }
    }

    // usado para impedir nomes repetidos
    async getByNome(nome: string) {
        try {
            return await prisma.categories.findUnique({
                where: { nome },
                select: camposCategoria,
            });
        } catch (error) {
            console.error(`Erro ao buscar categoria pelo nome: ${nome}:`, error);
            throw error;
        }
    }

    async create(data: CreateCategoryDTO) {
        try {
            return await prisma.categories.create({
                data,
                select: camposCategoria,
            });
        } catch (error) {
            console.error("Erro ao criar categoria:", error);
            throw error;
        }
    }

    async update(id: string, data: UpdateCategoryDTO) {
        try {
            return await prisma.categories.update({
                where: { id },
                data,
                select: camposCategoria,
            });
        } catch (error) {
            console.error(`Erro ao atualizar categoria: ${id}:`, error);
            throw error;
        }
    }

    // a exclusão só é feita depois de conferir se há produtos vinculados
    async countProducts(categoriaId: string) {
        return prisma.products.count({
            where: { categoria_id: categoriaId },
        });
    }

    async delete(id: string) {
        try {
            return await prisma.categories.delete({
                where: { id },
                select: camposCategoria,
            });
        } catch (error) {
            console.error(`Erro ao deletar categoria: ${id}:`, error);
            throw error;
        }
    }
}
