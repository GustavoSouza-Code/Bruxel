import { Router } from "express";
import { AuthController } from "../controller/authController";

// rotas de autenticação

const router = Router();
const authController = new AuthController();

router.post("/auth/login", authController.login);

export default router;