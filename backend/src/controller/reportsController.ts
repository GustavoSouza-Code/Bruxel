import { NextFunction, Request, Response } from "express";
import { FormatoRelatorio, Relatorio } from "../models/report";
import { ReportsService } from "../service/reportsService";
import { gerarCsv } from "../utils/exportaCsv";
import { gerarPdf } from "../utils/exportaPdf";

// controller dos relatórios, cuida da parte de requisições e respostas HTTP
export class ReportsController {
    private reportsService = new ReportsService();

    // pedidos da loja em json, csv ou pdf
    pedidos = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const formato = this.reportsService.validarFormato(req.query.formato);
            const relatorio = await this.reportsService.pedidos(req.query);
            return await this.responder(res, formato, relatorio, "pedidos");
        } catch (error) {
            next(error);
        }
    };

    // ordens de serviço em json, csv ou pdf
    atendimentos = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const formato = this.reportsService.validarFormato(req.query.formato);
            const relatorio = await this.reportsService.atendimentos(req.query);
            return await this.responder(res, formato, relatorio, "atendimentos");
        } catch (error) {
            next(error);
        }
    };

    // csv e pdf saem como download; o json segue o padrão das outras rotas
    private async responder(res: Response, formato: FormatoRelatorio, relatorio: Relatorio, nome: string) {
        const arquivo = `relatorio-${nome}-${new Date().toISOString().slice(0, 10)}`;

        if (formato === "csv") {
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${arquivo}.csv"`);
            return res.status(200).send(gerarCsv(relatorio));
        }

        if (formato === "pdf") {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${arquivo}.pdf"`);
            return res.status(200).send(await gerarPdf(relatorio));
        }

        return res.status(200).json(relatorio);
    }
}
