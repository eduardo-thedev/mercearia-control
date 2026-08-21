import { Request, Response } from "express";
import { z } from "zod";
import { transactionService } from "../services/transactionService";
import { asyncHandler } from "../utils/asyncHandler";
import { categoriesForType, PAYMENT_METHODS } from "../constants/transactionOptions";
import { Transaction } from "../types";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida. Use o formato AAAA-MM-DD.");

const baseTransactionSchema = z.object({
  type: z.enum(["entrada", "saida"], { errorMap: () => ({ message: "Tipo deve ser entrada ou saida." }) }),
  description: z.string().trim().min(1, "Descricao e obrigatoria.").max(255),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  category: z.string().trim().min(1, "Categoria e obrigatoria."),
  payment_method: z.enum(PAYMENT_METHODS as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Forma de pagamento invalida." }),
  }),
  date: dateSchema,
  notes: z.string().trim().max(1000).optional().nullable(),
});

// Valida que a categoria pertence a lista certa pro tipo (entrada vs saida) -
// gap que tinha ficado aberto na Fase 1.
const createTransactionSchema = baseTransactionSchema.superRefine((data, ctx) => {
  const allowed = categoriesForType(data.type);
  if (!allowed.includes(data.category)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["category"],
      message: `Categoria invalida para ${data.type}. Use uma de: ${allowed.join(", ")}.`,
    });
  }
});

const updateTransactionSchema = baseTransactionSchema.partial().superRefine((data, ctx) => {
  if (data.type && data.category) {
    const allowed = categoriesForType(data.type);
    if (!allowed.includes(data.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message: `Categoria invalida para ${data.type}. Use uma de: ${allowed.join(", ")}.`,
      });
    }
  }
});

const filtersSchema = z.object({
  type: z.enum(["entrada", "saida"]).optional(),
  category: z.string().optional(),
  payment_method: z.string().optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// NUMERIC do Postgres volta como string no pg - converte pra number na borda
// antes de responder, assim o frontend nunca lida com string de valor.
function serialize(transaction: Transaction) {
  return { ...transaction, amount: Number(transaction.amount) };
}

export const transactionController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const filters = filtersSchema.parse(req.query);
    const transactions = await transactionService.list(req.user!.sub, filters);
    return res.json({ transactions: transactions.map(serialize) });
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = filtersSchema.pick({ from: true, to: true }).parse(req.query);
    const summary = await transactionService.summary(req.user!.sub, { from, to });
    return res.json(summary);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const transaction = await transactionService.getById(req.user!.sub, req.params.id);
    return res.json({ transaction: serialize(transaction) });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createTransactionSchema.parse(req.body);
    const transaction = await transactionService.create(req.user!.sub, input);
    return res.status(201).json({ transaction: serialize(transaction) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateTransactionSchema.parse(req.body);
    const transaction = await transactionService.update(req.user!.sub, req.params.id, input);
    return res.json({ transaction: serialize(transaction!) });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await transactionService.remove(req.user!.sub, req.params.id);
    return res.status(204).send();
  }),
};
