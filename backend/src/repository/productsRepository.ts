import {CreateProductDTO, UpdateProductDTO} from '../models/products';
import { prisma } from '../database/prisma';

// lógica de interação com o banco de dados utilizando PrismaORM
// CRUD completo

export class productsRepository {

    async create(product: CreateProductDTO) {
        return prisma.products.create({
            data: product
        });
    }

    async getAll() {
        try {
            const products = await prisma.products.findMany();
            return products;
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            const products = await prisma.products.findUnique({
                where: {
                    id: id,
                }
            })
            return products;
        } catch (error) {
            console.error(`Erro ao buscar produto: ${id}:`, error);
            throw error;
        }
    }

    // GET necessário para verificar se produto já existe na camada Service
    async getByCodigo(codigo: string) {
        try {
            const products = await prisma.products.findUnique({
                where: {
                    codigo: codigo,
                }
            })
            return products;
        } catch (error) {
            console.error(`Erro ao buscar produto: ${codigo}:`, error);
            throw error;
        }
    }

    async update(id: string, data: UpdateProductDTO) {
        try {
            const updateProduct = await prisma.products.update({
                where: {
                    id: id,
                },
                data: data
            });
            return updateProduct;
        } catch (error) {
            console.error(`Erro ao atualizar produto: ${id}:`, error);
            throw error;
        }
    }

    async delete(id: string) {
        try {
            const deleteProduct = await prisma.products.delete({
                where: {
                    id: id,
                }
            });
            return deleteProduct;
        } catch (error) {
            console.error(`Erro ao deletar produto: ${id}:`, error);
            throw error;
        }
    }

}