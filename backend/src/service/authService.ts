import { UserRepository } from "../repository/userRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { perfil_usuario } from "../generated/prisma/enums";
import { LoginDTO } from "../models/user";

const CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos.";

interface AuthResponseDTO {
    token: string;
    user: {
        id: string;
        email: string;
        nome: string;
        // o front usa o perfil pra liberar (ou não) o painel admin
        perfil: perfil_usuario;
    };
}

// valida as credenciais e gera o token usado nas rotas protegidas
export class AuthService {
    constructor(private userRepository: UserRepository) {}

    async execute(dados: LoginDTO): Promise<AuthResponseDTO> {
        const corpo = (dados ?? {}) as LoginDTO;
        const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
        const senha = typeof corpo.senha === "string" ? corpo.senha : "";

        if (email === "" || senha === "") {
            throw new AppError(400, CREDENCIAIS_INVALIDAS);
        }

        const secretJWT = process.env.JWT_SECRET;
        if (!secretJWT) {
            throw new AppError(500, "Configuração de autenticação indisponível.");
        }

        // confere e-mail e senha contra o hash salvo
        const user = await this.userRepository.getByEmail(email);
        if (!user) {
            throw new AppError(400, CREDENCIAIS_INVALIDAS);
        }

        const verificaSenha = await bcrypt.compare(senha, user.senha);
        if (!verificaSenha) {
            throw new AppError(400, CREDENCIAIS_INVALIDAS);
        }

        // o token carrega id, e-mail e perfil por 5 dias
        const token = jwt.sign(
            { id: user.id, email: user.email, perfil: user.perfil },
            secretJWT,
            { expiresIn: "5d" }
        );

        // resposta pública consumida pela sessão do frontend
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                nome: user.nome,
                perfil: user.perfil,
            },
        };
    }
}
