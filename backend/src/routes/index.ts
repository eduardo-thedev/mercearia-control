import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { transactionRoutes } from "./transactionRoutes";
import { pendingRoutes } from "./pendingRoutes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/transactions", transactionRoutes);
routes.use("/pending", pendingRoutes);

// Fases seguintes vao pendurar aqui:
// routes.use("/dashboard", dashboardRoutes);
// routes.use("/reports", reportRoutes);
