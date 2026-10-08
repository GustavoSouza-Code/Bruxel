import {Request, Response} from "express";
import {UserService} from "../service/userService";

// controller de usuários, cuida da parte de requisições e respostas HTTP
// sem try/catch: no Express 5, um erro lançado num handler async vai direto pro
// handler global do server.ts, que devolve o status certo (AppError: 400/404/409;
// Prisma: P2002 → 409, P2025 → 404)
export class UserController {
    private userService = new UserService();

    create = async (req: Request, res: Response) => {
        const user = req.body;
        const result = await this.userService.create(user);
        return res.status(201).json(result);
    }

    getAll = async (req: Request, res: Response) => {
        const result = await this.userService.getAll();
        return res.status(200).json(result);
    }

    getById = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const result = await this.userService.getById(id);
        return res.status(200).json(result);
    }

    update = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const data = req.body;
        const result = await this.userService.update(id, data);
        return res.status(200).json(result);
    }

    delete = async (req: Request, res: Response) => {
        const id = String(req.params.id);
        const result = await this.userService.delete(id);
        return res.status(200).json(result);
    }
}
