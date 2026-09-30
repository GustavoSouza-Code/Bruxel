import {Request, Response, NextFunction} from 'express';

export function verificaAdmin(req: Request, res: Response, next: NextFunction) {
    const usuario = (req as any).usuario;

    if (!usuario || usuario.perfil !== 'ADMINISTRADOR') {
        return res.status(403).json({ mensagem: "Não autorizado." });
    }

    next();
}