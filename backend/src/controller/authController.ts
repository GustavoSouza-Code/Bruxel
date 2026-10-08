import {Request, Response} from 'express';
import {AuthService, AuthRequestDTO} from '../service/authService';
import {UserRepository} from "../repository/userRepository";

// sem try/catch: no Express 5, um erro lançado num handler async vai direto pro
// handler global do server.ts, que responde com o status certo (ex.: 400 no login errado)
export class AuthController {
    async login(req: Request, res: Response): Promise<Response> {
        const {email, senha}: AuthRequestDTO = req.body;

        const userRepository = new UserRepository();
        const autenticaUsuario = new AuthService(userRepository);
        const resultadoAuth = await autenticaUsuario.execute({email, senha});

        return res.status(200).json({
            mensagem: "Login realizado com sucesso",
            ...resultadoAuth
        });
    }
}
