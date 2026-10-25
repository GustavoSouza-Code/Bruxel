import { Router } from "express";
import { UserController } from "../controller/userController";
import { verificaToken } from "../middleware/verificaToken";
import { verificaAdmin } from "../middleware/verificaAdmin";

// cadastro público; listagem e exclusão exigem admin.
// Leitura e edição de um usuário são liberadas no controller para ele mesmo ou para o admin.
const router = Router();
const userController = new UserController();

router.post("/users", userController.create);
router.get("/users", verificaToken, verificaAdmin, userController.getAll);
router.get("/users/:id", verificaToken, userController.getById);
router.put("/users/:id", verificaToken, userController.update);
router.delete("/users/:id", verificaToken, verificaAdmin, userController.delete);

export default router;