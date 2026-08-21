import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

const COOKIE_NAME = "mercearia_token";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Nao autenticado." });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Sessao invalida ou expirada." });
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
