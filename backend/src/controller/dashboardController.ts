import { NextFunction, Request, Response } from "express";
import { DashboardService } from "../service/dashboardService";

// controller do dashboard, cuida da parte de requisições e respostas HTTP
export class DashboardController {
    private dashboardService = new DashboardService();

    // cartões do painel
    kpis = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            return res.status(200).json(await this.dashboardService.kpis());
        } catch (error) {
            next(error);
        }
    };

    // gráfico de barras; aceita ?meses=N
    receitaMensal = async (req: Request, res: Response, next: NextFunction) => {
        try {
            return res.status(200).json(await this.dashboardService.receitaMensal(req.query.meses));
        } catch (error) {
            next(error);
        }
    };

    // gráfico de pizza
    receitaPorCategoria = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            return res.status(200).json(await this.dashboardService.receitaPorCategoria());
        } catch (error) {
            next(error);
        }
    };

    // lista de cobrança das OS concluídas e não pagas
    aReceber = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            return res.status(200).json(await this.dashboardService.aReceber());
        } catch (error) {
            next(error);
        }
    };
}
