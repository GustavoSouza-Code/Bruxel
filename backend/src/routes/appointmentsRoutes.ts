import { Router } from "express";
import { AppointmentsController } from "../controller/appointmentsController";
import { verificaAdmin } from "../middleware/verificaAdmin";
import { verificaToken } from "../middleware/verificaToken";

// Ordens de Serviço: qualquer usuário logado pede e consulta as próprias ordens;
// o andamento e a OS só podem ser alterados pela gestão (admin/funcionário).
const router = Router();
const appointmentsController = new AppointmentsController();

router.post("/appointments", verificaToken, appointmentsController.create);
router.get("/appointments", verificaToken, appointmentsController.getAll);
router.get("/appointments/:id", verificaToken, appointmentsController.getById);
router.patch("/appointments/:id/status", verificaToken, verificaAdmin, appointmentsController.updateStatus);
router.put("/appointments/:id/os", verificaToken, verificaAdmin, appointmentsController.updateOs);
router.patch("/appointments/:id/pagamento", verificaToken, verificaAdmin, appointmentsController.markAsPaid);

export default router;
