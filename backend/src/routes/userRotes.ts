import { Router } from "express";
import { UserController } from "../controller/userController";

const router = Router();
const userController = new UserController();

router.post("/users", userController.create);
router.get("/users", userController.getAll);
router.get("/users/:id", userController.getById);
router.put("/users/:id", userController.update);
router.delete("/users/:id", userController.delete);

export default router;