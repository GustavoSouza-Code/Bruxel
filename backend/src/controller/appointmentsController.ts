import { NextFunction, Request, Response } from "express";
import { AppointmentsService } from "../service/appointmentsService";

// controller da Ordem de Serviço, cuida das requisições e respostas HTTP
export class AppointmentsController {
    private appointmentsService = new AppointmentsService();

    // cliente pede um atendimento
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.appointmentsService.create(req.usuario, req.body);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    // admin vê todas; cliente vê apenas as próprias ordens
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.appointmentsService.getAll(req.usuario, req.query);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // detalhe de uma ordem
    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.appointmentsService.getById(req.usuario, String(req.params.id));
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // andamento da ordem (rotas protegidas por admin)
    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.appointmentsService.updateStatus(String(req.params.id), req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // preenchimento da OS durante o atendimento (rota protegida por admin)
    updateOs = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.appointmentsService.updateOs(String(req.params.id), req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // registro do pagamento (rota protegida por admin)
    markAsPaid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.appointmentsService.marcarPago(String(req.params.id));
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}
