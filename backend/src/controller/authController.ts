import { NextFunction, Request, Response } from "express";
import { AuthService } from "../service/authService";
import { UserRepository } from "../repository/userRepository";

// controller de autenticação, cuida da parte de requisições e respostas HTTP
export class AuthController {
    private authService = new AuthService(new UserRepository());

    // recebe as credenciais e devolve o token com os dados básicos do usuário
    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const resultadoAuth = await this.authService.execute(req.body);

            return res.status(200).json({
                mensagem: "Login realizado com sucesso",
                ...resultadoAuth,
            });
        } catch (error) {
            next(error);
        }
    };
}
