import { NextFunction, Request, Response } from "express";
import { removerImagemAtendimento, urlDaImagemAtendimento } from "../config/uploads";
import { AppError } from "../errors/AppError";
import { AppointmentsService } from "../service/appointmentsService";

// controller da Ordem de Serviço, cuida das requisições e respostas HTTP
export class AppointmentsController {
    private appointmentsService = new AppointmentsService();

    // upload usado antes de abrir a OS; devolve a referência para gravar em foto_url
    uploadImage = (req: Request, res: Response, next: NextFunction) => {
        if (!req.file) {
            return next(new AppError(400, "Envie uma imagem no campo \"imagem\"."));
        }

        const origem = `${req.protocol}://${req.get("host")}`;
        return res.status(201).json({ foto_url: urlDaImagemAtendimento(req.file.filename, origem) });
    };

    // troca a foto de uma OS existente; a anterior é apagada do disco
    replaceImage = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.file) {
            return next(new AppError(400, "Envie uma imagem no campo \"imagem\"."));
        }

        const origem = `${req.protocol}://${req.get("host")}`;
        const novaFoto = urlDaImagemAtendimento(req.file.filename, origem);

        try {
            const { foto_anterior } = await this.appointmentsService.trocarImagem(
                req.usuario,
                String(req.params.id),
                novaFoto
            );
            await removerImagemAtendimento(foto_anterior);
            return res.status(200).json({ foto_url: novaFoto });
        } catch (error) {
            // a imagem nova já foi gravada pelo multer, mas a troca não concluiu
            await removerImagemAtendimento(novaFoto);
            next(error);
        }
    };

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

    // horários já reservados num intervalo (a tela do cliente esconde esses horários)
    getHorariosOcupados = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.appointmentsService.listarHorariosOcupados(req.query);
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
