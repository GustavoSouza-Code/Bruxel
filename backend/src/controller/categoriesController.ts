import { NextFunction, Request, Response } from "express";
import { CategoriesService } from "../service/categoriesService";

// controller de categorias, cuida da parte de requisições e respostas HTTP
export class CategoriesController {
    private categoriesService = new CategoriesService();

    // lista usada pelo catálogo e pelo formulário de produto
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.categoriesService.getAll();
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}
