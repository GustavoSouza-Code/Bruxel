import { NextFunction, Request, Response } from "express";

// libera a rota apenas para o perfil ADMINISTRADOR
export function verificaAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.usuario || req.usuario.perfil !== "ADMINISTRADOR") {
        return res.status(403).json({ mensagem: "Não autorizado." });
    }

    next();
}
