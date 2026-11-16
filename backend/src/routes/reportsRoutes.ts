import { Router } from "express";
import { ReportsController } from "../controller/reportsController";
import { verificaAdmin } from "../middleware/verificaAdmin";
import { verificaToken } from "../middleware/verificaToken";

// relatórios: só o administrador enxerga as vendas e os valores das OS de todos os clientes
const router = Router();
const reportsController = new ReportsController();

router.use("/reports", verificaToken, verificaAdmin);

router.get("/reports/pedidos", reportsController.pedidos);
router.get("/reports/atendimentos", reportsController.atendimentos);

export default router;
