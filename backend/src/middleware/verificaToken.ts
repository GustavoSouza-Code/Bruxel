import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repository/userRepository";

const userRepository = new UserRepository();

// valida o Bearer token, recarrega o usuário no banco e o deixa em req.usuario
export async function verificaToken(req: Request, res: Response, next: NextFunction) {
    const [esquema, token] = (req.headers.authorization ?? "").split(" ");
    if (esquema !== "Bearer" || !token) {
        return res.status(401).json({ mensagem: "Token não fornecido." });
    }

    let payload: jwt.JwtPayload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    } catch {
        return res.status(401).json({ mensagem: "Token inválido ou expirado." });
    }

    // garante que o token tem um id válido e que o usuário ainda existe
    if (typeof payload.id !== "string") {
        return res.status(401).json({ mensagem: "Token inválido ou expirado." });
    }

    const usuarioAtual = await userRepository.getById(payload.id);
    if (!usuarioAtual) {
        return res.status(401).json({ mensagem: "Usuário não existe mais." });
    }

    req.usuario = usuarioAtual;
    next();
}
