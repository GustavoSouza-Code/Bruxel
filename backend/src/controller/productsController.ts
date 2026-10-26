import { NextFunction, Request, Response } from "express";
import { ProductsService } from "../service/productsService";

// controller de produtos, cuida da parte de requisições e respostas HTTP
export class ProductsController {
    private productsService = new ProductsService();

    // cadastro de produto (rota protegida por admin)
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.productsService.create(req.body);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    // catálogo público
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.productsService.getAll();
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // detalhe público de um produto
    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.productsService.getById(String(req.params.id));
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // edição de produto (rota protegida por admin)
    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.productsService.update(String(req.params.id), req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // exclusão de produto (rota protegida por admin)
    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.productsService.delete(String(req.params.id));
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}
