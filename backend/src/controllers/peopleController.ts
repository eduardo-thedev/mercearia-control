import { Request, Response } from "express";
import { z } from "zod";
import { peopleService } from "../services/peopleService";
import { asyncHandler } from "../utils/asyncHandler";
import { Person, PersonWithTotals } from "../types";

const personSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(160),
  phone: z.string().trim().max(30).optional().nullable(),
});

const updatePersonSchema = personSchema.partial();

// NUMERIC (dos totais agregados) volta como string do pg - converte pra
// number na borda, igual o resto do projeto faz com amount.
function serialize(person: Person | PersonWithTotals) {
  const withTotals = person as Partial<PersonWithTotals>;
  return {
    ...person,
    ...(withTotals.total_receber_aberto !== undefined && {
      total_receber_aberto: Number(withTotals.total_receber_aberto),
    }),
    ...(withTotals.total_pagar_aberto !== undefined && {
      total_pagar_aberto: Number(withTotals.total_pagar_aberto),
    }),
  };
}

export const peopleController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const people = await peopleService.list(req.user!.sub, q);
    return res.json({ people: people.map(serialize) });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const person = await peopleService.getById(req.user!.sub, req.params.id);
    return res.json({ person: serialize(person) });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = personSchema.parse(req.body);
    const person = await peopleService.create(req.user!.sub, input);
    return res.status(201).json({ person: serialize(person) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updatePersonSchema.parse(req.body);
    const person = await peopleService.update(req.user!.sub, req.params.id, input);
    return res.json({ person: serialize(person!) });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await peopleService.remove(req.user!.sub, req.params.id);
    return res.status(204).send();
  }),
};
