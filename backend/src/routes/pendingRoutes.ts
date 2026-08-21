import { Router } from "express";
import { pendingController } from "../controllers/pendingController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const pendingRoutes = Router();

pendingRoutes.use(authMiddleware);

pendingRoutes.get("/summary", pendingController.summary);
pendingRoutes.get("/", pendingController.list);
pendingRoutes.get("/:id", pendingController.getById);
pendingRoutes.post("/", pendingController.create);
pendingRoutes.put("/:id", pendingController.update);
pendingRoutes.delete("/:id", pendingController.remove);
pendingRoutes.post("/:id/baixa", pendingController.settle);
