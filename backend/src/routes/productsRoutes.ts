import { Router } from "express";
import { ProductsController } from "../controller/productsController";
import { verificaToken } from "../middleware/verificaToken";
import { verificaAdmin } from "../middleware/verificaAdmin";

const router = Router();
const productsController = new ProductsController();

router.get("/products", productsController.getAll);
router.get("/products/:id", productsController.getById);
router.post("/products", verificaToken, verificaAdmin, productsController.create);
router.put("/products/:id", verificaToken, verificaAdmin, productsController.update);
router.delete("/products/:id", verificaToken, verificaAdmin, productsController.delete);

export default router;