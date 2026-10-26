import { NextFunction, Request, Response } from "express";
import { CategoriesService } from "../service/categoriesService";

// controller de categorias, cuida da parte de requisições e respostas HTTP
export class CategoriesController {
    private categoriesService = new CategoriesService();

    // cadastro de categoria (rota protegida por admin)
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.categoriesService.create(req.body);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    // lista usada pelo catálogo e pelo formulário de produto
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.categoriesService.getAll();
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // detalhe público de uma categoria
    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.categoriesService.getById(String(req.params.id));
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // edição de categoria (rota protegida por admin)
    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.categoriesService.update(String(req.params.id), req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // exclusão de categoria (rota protegida por admin)
    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.categoriesService.delete(String(req.params.id));
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}
