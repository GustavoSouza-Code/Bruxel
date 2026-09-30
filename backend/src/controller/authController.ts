import {Request, Response} from 'express';
import {AuthService, AuthRequestDTO} from '../service/authService';
import {UserRepository} from "../repository/userRepository";

export class AuthController {
    async login(req: Request, res: Response): Promise<Response> {
        try {
            const {email, senha}: AuthRequestDTO = req.body;

            const userRepository = new UserRepository();
            const autenticaUsuario = new AuthService(userRepository);
            const resultadoAuth = await autenticaUsuario.execute({email, senha});

            return res.status(200).json({
                mensagem: "Login realizado com sucesso",
                ...resultadoAuth
            });
        } catch (error: any) {
            try {
                const errosAutentica = JSON.parse(error.message);
                return res.status(400).json({erros: errosAutentica});
            } catch {
                return res.status(500).json({mensagem: error.message || "Erro interno do servidor."});
            }
        }
    }
}