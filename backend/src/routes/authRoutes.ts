import { Router } from "express";
import { AuthController } from "../controller/authController";

// rota pública de login
const router = Router();
const authController = new AuthController();

router.post("/auth/login", authController.login);

export default router;