import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { transactionRoutes } from "./transactionRoutes";
import { pendingRoutes } from "./pendingRoutes";
import { reportRoutes } from "./reportRoutes";
import { peopleRoutes } from "./peopleRoutes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/transactions", transactionRoutes);
routes.use("/pending", pendingRoutes);
routes.use("/reports", reportRoutes);
routes.use("/people", peopleRoutes);
