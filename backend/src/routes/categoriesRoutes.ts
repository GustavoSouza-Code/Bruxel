import { Router } from "express";
import { CategoriesController } from "../controller/categoriesController";

// rotas de categorias (leitura pública, como o catálogo de produtos)
const router = Router();
const categoriesController = new CategoriesController();

router.get("/categories", categoriesController.getAll);

export default router;
