import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

export function verificaToken(req: Request, res: Response, next: NextFunction) {
    const cabecalho = req.headers.authorization;
    if (!cabecalho) {
        return res.status(401).json({mensagem: "Token não fornecido."})
    }

    const partes = cabecalho.split(' ');
    const token = partes[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).usuario = payload;
        next()
    } catch(erro) {
        return res.status(401).json({mensagem: "Token inválido ou expirado."})
    }

}