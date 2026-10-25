import { Router } from "express";
import { OrdersController } from "../controller/ordersController";
import { verificaToken } from "../middleware/verificaToken";

// rotas de pedidos: qualquer usuário logado compra; o cliente só enxerga os próprios pedidos
const router = Router();
const ordersController = new OrdersController();

router.post("/orders", verificaToken, ordersController.create);
router.get("/orders", verificaToken, ordersController.getAll);

export default router;
