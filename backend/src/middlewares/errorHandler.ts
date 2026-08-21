import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return res.status(400).json({ error: firstIssue?.message ?? "Dados invalidos." });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // eslint-disable-next-line no-console
  console.error("Erro nao tratado:", err);
  return res.status(500).json({ error: "Erro interno do servidor." });
}
