import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let pastaTemporaria: string;
let app: express.Express;
let AppError: typeof import("../src/errors/AppError").AppError;

beforeAll(async () => {
    pastaTemporaria = fs.mkdtempSync(path.join(os.tmpdir(), "bruxel-upload-"));
    process.env.UPLOAD_DIR = pastaTemporaria;
    process.env.PUBLIC_BASE_URL = "https://bruxel.exemplo.com/";
    vi.resetModules();

    ({ AppError } = await import("../src/errors/AppError"));
    const { receberImagemProduto } = await import("../src/middleware/uploadProductImage");
    const { urlDaImagem } = await import("../src/config/uploads");

    app = express();
    app.post("/products/images", receberImagemProduto, (req: Request, res: Response) => {
        const arquivo = req.file;
        if (!arquivo) return res.status(400).json({ mensagem: "Envie uma imagem." });
        return res.status(201).json({ url_imagem: urlDaImagem(arquivo.filename, "http://localhost:3000") });
    });
    app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
        if (erro instanceof AppError) {
            return res.status(erro.statusCode).json({ mensagem: erro.message });
        }
        return res.status(500).json({ mensagem: "Erro interno." });
    });
});

afterAll(() => {
    fs.rmSync(pastaTemporaria, { recursive: true, force: true });
});

describe("upload de imagem do produto", () => {
    it("salva a imagem e devolve a referência pública", async () => {
        const conteudo = Buffer.from("conteudo-de-teste");
        const resposta = await request(app)
            .post("/products/images")
            .attach("imagem", conteudo, { filename: "foto.png", contentType: "image/png" });

        expect(resposta.status).toBe(201);
        expect(resposta.body.url_imagem).toMatch(
            /^https:\/\/bruxel\.exemplo\.com\/api\/uploads\/produtos\/[0-9a-f-]+\.png$/
        );

        const nomeArquivo = resposta.body.url_imagem.split("/").pop();
        const salvo = path.join(pastaTemporaria, "produtos", nomeArquivo);
        expect(fs.readFileSync(salvo)).toEqual(conteudo);
    });

    it("recusa arquivo que não é imagem", async () => {
        const resposta = await request(app)
            .post("/products/images")
            .attach("imagem", Buffer.from("texto"), { filename: "arquivo.txt", contentType: "text/plain" });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toContain("JPG");
    });

    it("recusa imagem maior que 5 MB", async () => {
        const resposta = await request(app)
            .post("/products/images")
            .attach("imagem", Buffer.alloc(5 * 1024 * 1024 + 1), {
                filename: "grande.png",
                contentType: "image/png",
            });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toContain("5 MB");
    });
});
