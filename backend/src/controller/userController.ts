import { Request, Response } from "express";
import { UserService } from "../service/userService";

export class UserController {
  private userService = new UserService();

  async create(req: Request, res: Response) {
    const user = req.body;

    const result = await this.userService.create(user);

    return res.status(201).json(result);
  }

  async getAll(req: Request, res: Response) {
    const result = await this.userService.getAll();

    return res.status(200).json(result);
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id as string;

    const result = await this.userService.getById(id);

    return res.status(200).json(result);
  }

  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const data = req.body;

    const result = await this.userService.update(id, data);

    return res.status(200).json(result);
  }

  async delete(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await this.userService.delete(id);

    return res.status(200).json(result);
  }
}
