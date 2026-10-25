import { CreateProductDTO, UpdateProductDTO } from "../models/products";
import { prisma } from "../database/prisma";

// acesso ao banco para o CRUD de produtos
export class ProductsRepository {

    // grava o produto já validado pelo service
    async create(product: CreateProductDTO) {
        return prisma.products.create({ data: product });
    }

    // listagem do catálogo
    async getAll() {
        try {
            return await prisma.products.findMany();
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            return await prisma.products.findUnique({ where: { id } });
        } catch (error) {
            console.error(`Erro ao buscar produto: ${id}:`, error);
            throw error;
        }
    }

    // usado pelo fluxo de compra: busca todos os produtos do pedido de uma vez
    async getByIds(ids: string[]) {
        if (ids.length === 0) return [];

        try {
            return await prisma.products.findMany({
                where: { id: { in: ids } },
            });
        } catch (error) {
            console.error("Erro ao buscar produtos do pedido:", error);
            throw error;
        }
    }

    // usado para impedir código repetido
    async getByCodigo(codigo: string) {
        try {
            return await prisma.products.findUnique({ where: { codigo } });
        } catch (error) {
            console.error(`Erro ao buscar produto: ${codigo}:`, error);
            throw error;
        }
    }

    // atualização de um produto existente
    async update(id: string, data: UpdateProductDTO) {
        try {
            return await prisma.products.update({
                where: { id },
                data,
            });
        } catch (error) {
            console.error(`Erro ao atualizar produto: ${id}:`, error);
            throw error;
        }
    }

    // exclusão de um produto existente
    async delete(id: string) {
        try {
            return await prisma.products.delete({ where: { id } });
        } catch (error) {
            console.error(`Erro ao deletar produto: ${id}:`, error);
            throw error;
        }
    }
}
