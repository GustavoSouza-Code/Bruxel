import { Router } from "express";
import { DashboardController } from "../controller/dashboardController";
import { verificaAdmin } from "../middleware/verificaAdmin";
import { verificaToken } from "../middleware/verificaToken";

// dashboard: só o administrador enxerga a receita e as cobranças da empresa
const router = Router();
const dashboardController = new DashboardController();

router.use("/dashboard", verificaToken, verificaAdmin);

router.get("/dashboard/kpis", dashboardController.kpis);
router.get("/dashboard/receita-mensal", dashboardController.receitaMensal);
router.get("/dashboard/receita-por-categoria", dashboardController.receitaPorCategoria);
router.get("/dashboard/a-receber", dashboardController.aReceber);

export default router;
