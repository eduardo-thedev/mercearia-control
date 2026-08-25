import { Request, Response } from "express";
import { z } from "zod";
import { reportService } from "../services/reportService";
import { asyncHandler } from "../utils/asyncHandler";

const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Mes invalido. Use o formato AAAA-MM.");

const monthlyQuerySchema = z.object({
  month: monthSchema,
});

const categoriesQuerySchema = z.object({
  month: monthSchema,
  type: z.enum(["entrada", "saida"]),
});

const evolutionQuerySchema = z.object({
  months: z.coerce.number().int().min(2).max(24).optional().default(6),
});

export const reportController = {
  monthly: asyncHandler(async (req: Request, res: Response) => {
    const { month } = monthlyQuerySchema.parse(req.query);
    const report = await reportService.monthly(req.user!.sub, month);
    return res.json(report);
  }),

  categories: asyncHandler(async (req: Request, res: Response) => {
    const { month, type } = categoriesQuerySchema.parse(req.query);
    const categories = await reportService.categories(req.user!.sub, { month, type });
    return res.json({ categories });
  }),

  evolution: asyncHandler(async (req: Request, res: Response) => {
    const { months } = evolutionQuerySchema.parse(req.query);
    const evolution = await reportService.evolution(req.user!.sub, months);
    return res.json({ evolution });
  }),
};
