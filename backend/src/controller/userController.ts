import { NextFunction, Request, Response } from "express";
import { UserService } from "../service/userService";

// controller de usuários, cuida da parte de requisições e respostas HTTP
export class UserController {
  private userService = new UserService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.create(req.body);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.getAll();
      return res.status(200).json(result);
    } catch (error: any) {
      return res
        .status(500)
        .json({ mensagem: error.message || "Erro ao buscar usuários." });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await this.userService.getById(id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const result = await this.userService.update(id, data);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ mensagem: "Erro ao atualizar usuário." });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const result = await this.userService.delete(id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ mensagem: "Erro ao deletar usuário." });
    }
  };
}
