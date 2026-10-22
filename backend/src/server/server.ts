import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import "../types/express";
import userRoutes from "../routes/userRoutes";
import productsRoutes from "../routes/productsRoutes";
import categoriesRoutes from "../routes/categoriesRoutes";
import ordersRoutes from "../routes/ordersRoutes";
import authRoutes from "../routes/authRoutes";
import { AppError } from "../errors/AppError";
import { Prisma } from "../generated/prisma/client";

// inicializa a API e centraliza o tratamento de erros
const app = express();
const PORT = 3000;

// sem a chave não dá para assinar nem verificar os tokens; falha antes de subir
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado no ambiente.");
}

// middlewares globais
app.use(cors());
app.use(express.json());

// rotas da API
app.use("/api", userRoutes);
app.use("/api", productsRoutes);
app.use("/api", categoriesRoutes);
app.use("/api", ordersRoutes);
app.use("/api", authRoutes);

// converte erros de negócio e do Prisma em respostas HTTP
app.use((erro: unknown, _req: Request, res: Response, next: NextFunction) => {
    // se a resposta já começou, deixa o Express encerrar a conexão
    if (res.headersSent) {
        return next(erro);
    }

    if (erro instanceof AppError) {
        return res.status(erro.statusCode).json({
            mensagem: erro.message,
            erros: erro.detalhes,
        });
    }

    // JSON malformado é erro de entrada, não erro interno
    if (erro instanceof SyntaxError && (erro as { status?: number }).status === 400) {
        return res.status(400).json({ mensagem: "JSON inválido." });
    }

    // erros de validação do Prisma também são causados pelos dados enviados
    if (erro instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({ mensagem: "Dados inválidos." });
    }

    // erros conhecidos do Prisma viram respostas de conflito/404
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
        if (erro.code === "P2002") {
            return res.status(409).json({ mensagem: "Já existe um registro com esse valor." });
        }
        if (erro.code === "P2025") {
            return res.status(404).json({ mensagem: "Registro não encontrado." });
        }
        if (erro.code === "P2003") {
            return res.status(409).json({ mensagem: "Registro está ligado a outros dados." });
        }
    }

    // qualquer erro não previsto não expõe detalhes internos
    console.error(erro);
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
});

// porta fixa usada pelo frontend
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
