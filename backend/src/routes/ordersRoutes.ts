import { Router } from "express";
import { OrdersController } from "../controller/ordersController";
import { verificaAdmin } from "../middleware/verificaAdmin";
import { verificaToken } from "../middleware/verificaToken";

// rotas de pedidos: qualquer usuário logado compra; o cliente só enxerga os próprios pedidos
const router = Router();
const ordersController = new OrdersController();

router.post("/orders", verificaToken, ordersController.create);
router.get("/orders", verificaToken, ordersController.getAll);
router.patch("/orders/:id/status", verificaToken, verificaAdmin, ordersController.updateStatus);

export default router;
