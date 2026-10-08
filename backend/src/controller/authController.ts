import { NextFunction, Request, Response } from "express";
import { AuthService, AuthRequestDTO } from "../service/authService";
import { UserRepository } from "../repository/userRepository";

// controller de autenticação, cuida da parte de requisições e respostas HTTP
export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, senha }: AuthRequestDTO = req.body;

      const userRepository = new UserRepository();
      const autenticaUsuario = new AuthService(userRepository);
      const resultadoAuth = await autenticaUsuario.execute({ email, senha });

      return res.status(200).json({
        mensagem: "Login realizado com sucesso",
        ...resultadoAuth,
      });
    } catch (error) {
      next(error);
    }
  };
}
