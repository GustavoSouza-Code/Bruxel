import { prisma } from "../database/prisma";

// leitura das categorias
export class CategoriesRepository {

    async getAll() {
        try {
            return await prisma.categories.findMany({
                select: { id: true, nome: true },
                orderBy: { nome: "asc" },
            });
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
            throw error;
        }
    }

    // usado pelo ProductsService para validar a categoria antes de salvar
    async getById(id: string) {
        try {
            return await prisma.categories.findUnique({
                where: { id },
                select: { id: true, nome: true },
            });
        } catch (error) {
            console.error(`Erro ao buscar categoria: ${id}:`, error);
            throw error;
        }
    }
}
