import type { UsuarioAutenticado } from "../models/user";

// deixa req.usuario tipado em todas as rotas (o middleware preenche em runtime)
declare global {
    namespace Express {
        interface Request {
            usuario: UsuarioAutenticado;
        }
    }
}

export {};
