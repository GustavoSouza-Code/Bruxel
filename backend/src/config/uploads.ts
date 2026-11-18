import fs from "node:fs";
import path from "node:path";

// Em produção, UPLOAD_DIR pode apontar para um volume fora do código.
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
export const PRODUCT_IMAGES_DIR = path.join(UPLOAD_DIR, "produtos");

// caminho público servido pela API; passa pelo proxy /api já configurado no deploy
export const UPLOAD_PUBLIC_PATH = "/api/uploads";

// as imagens novas precisam existir antes de o multer gravar
fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });

export function urlDaImagem(nomeArquivo: string, origem: string): string {
    const base = (process.env.PUBLIC_BASE_URL || origem).replace(/\/+$/, "");
    return `${base}${UPLOAD_PUBLIC_PATH}/produtos/${nomeArquivo}`;
}
