import {UserRepository} from "../repository/userRepository";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {AppError} from "../errors/AppError";

export interface AuthRequestDTO {
    email: string;
    senha: string;
}

interface AuthResponseDTO {
    token: string;
    user: {
        id: string;
        email: string;
        nome: string;
    }
}

export class AuthService {
    constructor(private userRepository: UserRepository) {}

    async execute({email, senha}: AuthRequestDTO): Promise<AuthResponseDTO> {
        const user = await this.userRepository.getByEmail(email);
        if (!user) {
            throw new AppError(400, 'E-mail ou senha incorretos.')
        }

        const verificaSenha = await bcrypt.compare(senha, user.senha)
        if (!verificaSenha) {
            throw new AppError(400, 'E-mail ou senha incorretos.')
        }

        const secretJWT = process.env.JWT_SECRET;
        if (!secretJWT) {
            throw new AppError(404,'Chave secreta JWT não configurada no ambiente.');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, perfil: user.perfil },
            secretJWT,
            { expiresIn: '5d' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                nome: user.nome
            }
        }

    }
}