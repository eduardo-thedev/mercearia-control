import { Router } from "express";
import { reportController } from "../controllers/reportController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const reportRoutes = Router();

reportRoutes.use(authMiddleware);

reportRoutes.get("/monthly", reportController.monthly);
reportRoutes.get("/categories", reportController.categories);
reportRoutes.get("/evolution", reportController.evolution);
