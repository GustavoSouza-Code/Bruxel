import { Router } from "express";
import { UserController } from "../controller/userController";
import { verificaToken } from "../middleware/verificaToken";
import { verificaAdmin } from "../middleware/verificaAdmin";

// rotas de usuário

const router = Router();
const userController = new UserController();

router.post("/users", userController.create);
router.get("/users", verificaToken, verificaAdmin, userController.getAll);
router.get("/users/:id", verificaToken, verificaAdmin, userController.getById);
router.put("/users/:id", verificaToken, verificaAdmin, userController.update);
router.delete("/users/:id", verificaToken, verificaAdmin, userController.delete);

export default router;