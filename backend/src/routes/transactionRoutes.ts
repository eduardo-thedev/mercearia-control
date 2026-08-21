import { Router } from "express";
import { transactionController } from "../controllers/transactionController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const transactionRoutes = Router();

transactionRoutes.use(authMiddleware);

// /summary tem que vir antes de /:id, senao o Express trata "summary" como um id
transactionRoutes.get("/summary", transactionController.summary);
transactionRoutes.get("/", transactionController.list);
transactionRoutes.get("/:id", transactionController.getById);
transactionRoutes.post("/", transactionController.create);
transactionRoutes.put("/:id", transactionController.update);
transactionRoutes.delete("/:id", transactionController.remove);
