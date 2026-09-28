import { Router } from "express";
import { ProductsController } from "../controller/productsController";

// rotas de produto

const router = Router();
const productsController = new ProductsController();

router.post("/products", productsController.create);
router.get("/products", productsController.getAll);
router.get("/products/:id", productsController.getById);
router.put("/products/:id", productsController.update);
router.delete("/products/:id", productsController.delete);

export default router;