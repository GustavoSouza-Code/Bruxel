import {Request, Response} from "express";
import {ProductsService} from "../service/productsService";

// controller de produtos, cuida da parte de requisições e respostas HTTP
export class ProductsController {
    private productsService = new ProductsService();

    async create(req: Request, res: Response) {
        const product = req.body;
        try {
            const result = await this.productsService.create(product);
            return res.status(201).json(result);
        } catch (error: any) {
            try {
                const errosValidacao = JSON.parse(error.message);
                return res.status(400).json({erros: errosValidacao});
            } catch {
                return res.status(500).json({mensagem: error.message || "Erro interno do servidor."});
            }
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const result = await this.productsService.getAll();
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({mensagem: error.message || "Erro ao buscar produtos."});
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const result = await this.productsService.getById(id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(404).json({mensagem: "Produto não encontrado."});
        }
    }

    async update(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const data = req.body;
            const result = await this.productsService.update(id, data);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({mensagem: "Erro ao atualizar produto."});
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const id = String(req.params.id);
            const result = await this.productsService.delete(id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({mensagem: "Erro ao deletar produto."});
        }
    }
}
