import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";
import { isProduction } from "../config/env";
import { AUTH_COOKIE_NAME } from "../middlewares/authMiddleware";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Usuario precisa ter pelo menos 3 caracteres.")
  .max(30, "Usuario pode ter no maximo 30 caracteres.")
  .regex(/^[a-z0-9._-]+$/, "Use apenas letras, numeros, ponto, hifen ou underline.");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto."),
  username: usernameSchema,
  email: z.string().trim().email("E-mail invalido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Informe seu usuario ou e-mail."),
  password: z.string().min(1, "Informe a senha."),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("E-mail invalido."),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token invalido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: SEVEN_DAYS_MS,
  });
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const { user, token } = await authService.register(input);
    setAuthCookie(res, token);
    return res.status(201).json({ user });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const { user, token } = await authService.login(input);
    setAuthCookie(res, token);
    return res.status(200).json({ user });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE_NAME);
    return res.status(200).json({ message: "Logout realizado." });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const user = await authService.getProfile(userId);
    return res.status(200).json({ user });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    // Mensagem generica sempre, exista ou nao a conta - nao vaza quem tem cadastro
    return res.json({ message: "Se esse e-mail existir na nossa base, você vai receber um link de redefinição." });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);
    return res.json({ message: "Senha redefinida com sucesso." });
  }),
};
