import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from "../middlewares/rateLimiters";

export const authRoutes = Router();

authRoutes.post("/register", registerLimiter, authController.register);
authRoutes.post("/login", loginLimiter, authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", authMiddleware, authController.me);
authRoutes.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);
authRoutes.post("/reset-password", authController.resetPassword);
