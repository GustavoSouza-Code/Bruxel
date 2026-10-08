import express from 'express';
import cors from 'cors';
import userRoutes from '../routes/userRoutes';
import productsRoutes from '../routes/productsRoutes';
import authRoutes from "../routes/authRoutes";
import {AppError} from "../errors/AppError";
import {Request, Response, NextFunction} from "express";
import {Prisma} from "../generated/prisma/client";
import "dotenv/config";

// arquivo server, necessário para inicializar o back-end

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', productsRoutes);
app.use('/api', authRoutes);


app.use((erro: unknown, req: Request, res: Response, next: NextFunction) => {
    if (erro instanceof AppError) {
        
        console.log("APP ERROR:", erro);
        console.log("DETALHES:", erro.detalhes);

        return res.status(erro.statusCode).json({mensagem: erro.message, erros: erro.detalhes});
    }
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
        if (erro.code === "P2002") return res.status(409).json({mensagem: "Já existe um registro com esse valor."});
        if (erro.code === "P2025") return res.status(404).json({mensagem: "Registro não encontrado."});
        if (erro.code === "P2003") return res.status(409).json({mensagem: "Registro está ligado a outros dados."});
    }
    console.error(erro);
    return res.status(500).json({mensagem: "Erro interno do servidor."});
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});