import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {UserRepository} from "../repository/userRepository";

const userRepository = new UserRepository();

export async function verificaToken(req: Request, res: Response, next: NextFunction) {
    const [esquema, token] = (req.headers.authorization ?? '').split(' ');
    if (esquema !== 'Bearer' || !token) {
        return res.status(401).json({mensagem: "Token não fornecido."});
    }

    let payload: jwt.JwtPayload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    } catch {
        return res.status(401).json({mensagem: "Token inválido ou expirado."});
    }

    const usuarioAtual = await userRepository.getById(String(payload.id));
    if (!usuarioAtual) {
        return res.status(401).json({mensagem: "Usuário não existe mais."});
    }

    (req as any).usuario = usuarioAtual;
    next();
}