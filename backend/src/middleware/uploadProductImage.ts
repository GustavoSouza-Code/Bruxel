import crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError";
import { PRODUCT_IMAGES_DIR } from "../config/uploads";

const EXTENSOES: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
};

const armazenamento = multer.diskStorage({
    destination: (_req, _arquivo, cb) => cb(null, PRODUCT_IMAGES_DIR),
    // nome aleatório evita colisão e não reutiliza o nome enviado pelo cliente
    filename: (_req, arquivo, cb) => cb(null, `${crypto.randomUUID()}${EXTENSOES[arquivo.mimetype]}`),
});

const upload = multer({
    storage: armazenamento,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, arquivo, cb) => {
        if (!EXTENSOES[arquivo.mimetype]) {
            return cb(new AppError(400, "Envie uma imagem JPG, PNG, WEBP ou GIF."));
        }
        cb(null, true);
    },
});

export function receberImagemProduto(req: Request, res: Response, next: NextFunction) {
    upload.single("imagem")(req, res, (erro) => {
        if (erro instanceof multer.MulterError) {
            const mensagem = erro.code === "LIMIT_FILE_SIZE"
                ? "A imagem deve ter no máximo 5 MB."
                : "Não foi possível enviar a imagem.";
            return next(new AppError(400, mensagem));
        }
        next(erro);
    });
}
