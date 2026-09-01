import { Request, Response } from "express";
import { z } from "zod";
import { pendingService } from "../services/pendingService";
import { asyncHandler } from "../utils/asyncHandler";
import { PAYMENT_METHODS } from "../constants/transactionOptions";
import { PendingTransaction } from "../types";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida. Use o formato AAAA-MM-DD.");

const basePendingSchema = z.object({
  type: z.enum(["receber", "pagar"], { errorMap: () => ({ message: "Tipo deve ser receber ou pagar." }) }),
  person_id: z.string().uuid("Selecione um cliente/fornecedor."),
  description: z.string().trim().min(1, "Descricao e obrigatoria.").max(255),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  due_date: dateSchema,
  notes: z.string().trim().max(1000).optional().nullable(),
});

const createPendingSchema = basePendingSchema;
const updatePendingSchema = basePendingSchema.partial();

const filtersSchema = z.object({
  type: z.enum(["receber", "pagar"]).optional(),
  status: z.enum(["pendente", "pago", "recebido", "vencido"]).optional(),
  person_id: z.string().uuid().optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

const settleSchema = z.object({
  payment_method: z.enum(PAYMENT_METHODS as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Forma de pagamento invalida." }),
  }),
});

// NUMERIC volta como string do pg - converte pra number na borda
function serialize(pending: PendingTransaction) {
  return { ...pending, amount: Number(pending.amount) };
}

export const pendingController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const filters = filtersSchema.parse(req.query);
    const pending = await pendingService.list(req.user!.sub, filters);
    return res.json({ pending: pending.map(serialize) });
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await pendingService.summary(req.user!.sub);
    return res.json(summary);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const pending = await pendingService.getById(req.user!.sub, req.params.id);
    return res.json({ pending: serialize(pending) });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createPendingSchema.parse(req.body);
    const pending = await pendingService.create(req.user!.sub, input);
    return res.status(201).json({ pending: serialize(pending) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updatePendingSchema.parse(req.body);
    const pending = await pendingService.update(req.user!.sub, req.params.id, input);
    return res.json({ pending: serialize(pending!) });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await pendingService.remove(req.user!.sub, req.params.id);
    return res.status(204).send();
  }),

  settle: asyncHandler(async (req: Request, res: Response) => {
    const { payment_method } = settleSchema.parse(req.body);
    const result = await pendingService.settle(req.user!.sub, req.params.id, payment_method);
    return res.json({ pending: serialize(result.pending), transactionId: result.transactionId });
  }),
};
