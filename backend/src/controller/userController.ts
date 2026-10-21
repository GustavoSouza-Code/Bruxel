import { NextFunction, Request, Response } from "express";
import { UserService } from "../service/userService";
import { UsuarioAutenticado } from "../models/user";

// controller de usuários, cuida da parte de requisições e respostas HTTP
export class UserController {
    private userService = new UserService();

    // cadastro público
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.userService.create(req.body);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    // listagem restrita ao admin
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.userService.getAll();
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // próprio usuário ou admin
    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = String(req.params.id);
            if (!this.podeAcessar(req.usuario, id)) {
                return res.status(403).json({ mensagem: "Não autorizado." });
            }

            const result = await this.userService.getById(id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // próprio usuário ou admin
    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = String(req.params.id);
            if (!this.podeAcessar(req.usuario, id)) {
                return res.status(403).json({ mensagem: "Não autorizado." });
            }

            // trocando a própria senha (inclusive admin), precisa confirmar a atual
            const result = await this.userService.update(id, req.body, req.usuario.id === id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // exclusão restrita ao admin
    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.userService.delete(String(req.params.id));
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    private podeAcessar(usuario: UsuarioAutenticado, id: string) {
        return usuario.perfil === "ADMINISTRADOR" || usuario.id === id;
    }
}
