import { Router } from "express";
import { peopleController } from "../controllers/peopleController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const peopleRoutes = Router();

peopleRoutes.use(authMiddleware);

peopleRoutes.get("/", peopleController.list);
peopleRoutes.get("/:id", peopleController.getById);
peopleRoutes.post("/", peopleController.create);
peopleRoutes.put("/:id", peopleController.update);
peopleRoutes.delete("/:id", peopleController.remove);
