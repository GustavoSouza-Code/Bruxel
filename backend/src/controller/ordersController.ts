import { NextFunction, Request, Response } from "express";
import { OrdersService } from "../service/ordersService";

// controller de pedidos, cuida da parte de requisições e respostas HTTP
export class OrdersController {
    private ordersService = new OrdersService();

    // cria o pedido para o usuário autenticado
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.ordersService.create(req.usuario.id, req.body);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    // admin vê todos; cliente vê apenas os próprios pedidos
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.ordersService.getAll(
                req.usuario.id,
                req.usuario.perfil === "ADMINISTRADOR"
            );
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}
