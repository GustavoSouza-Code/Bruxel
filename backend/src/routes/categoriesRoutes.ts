import { Router } from "express";
import { CategoriesController } from "../controller/categoriesController";
import { verificaToken } from "../middleware/verificaToken";
import { verificaAdmin } from "../middleware/verificaAdmin";

// leitura pública; cadastro, edição e exclusão exigem admin
const router = Router();
const categoriesController = new CategoriesController();

router.get("/categories", categoriesController.getAll);
router.get("/categories/:id", categoriesController.getById);
router.post("/categories", verificaToken, verificaAdmin, categoriesController.create);
router.put("/categories/:id", verificaToken, verificaAdmin, categoriesController.update);
router.delete("/categories/:id", verificaToken, verificaAdmin, categoriesController.delete);

export default router;
