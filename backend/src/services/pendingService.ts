import { pendingRepository } from "../repositories/pendingRepository";
import { peopleService } from "./peopleService";
import { AppError } from "../utils/AppError";
import { PendingFilters, PendingType } from "../types";

export class PendingError extends AppError {}

interface PendingInput {
  type: PendingType;
  person_id: string;
  description: string;
  amount: number;
  due_date: string;
  notes?: string | null;
}

// Categoria usada no lancamento gerado pela baixa. "Recebimento de
// pendencia" existe na lista de categorias de entrada (secao 5 do
// context.md); a lista de saida nao tem uma categoria especifica pra
// "pagamento de pendencia", entao usamos "Outros" - decisao de projeto,
// nao um valor arbitrario escondido.
const SETTLE_CATEGORY: Record<PendingType, string> = {
  receber: "Recebimento de pendência",
  pagar: "Outros",
};

export const pendingService = {
  async list(userId: string, filters: PendingFilters) {
    return pendingRepository.list(userId, filters);
  },

  async getById(userId: string, id: string) {
    const pending = await pendingRepository.findById(userId, id);
    if (!pending) {
      throw new PendingError("Pendencia nao encontrada.", 404);
    }
    return pending;
  },

  async create(userId: string, input: PendingInput) {
    await peopleService.assertBelongsToUser(userId, input.person_id);
    return pendingRepository.create(userId, input);
  },

  async update(userId: string, id: string, input: Partial<PendingInput>) {
    const existing = await pendingRepository.findById(userId, id);
    if (!existing) {
      throw new PendingError("Pendencia nao encontrada.", 404);
    }
    if (existing.status !== "pendente") {
      throw new PendingError("Pendencias ja baixadas (pagas/recebidas) nao podem ser editadas.", 409);
    }
    if (input.person_id) {
      await peopleService.assertBelongsToUser(userId, input.person_id);
    }
    return pendingRepository.update(userId, id, input);
  },

  async remove(userId: string, id: string) {
    const existing = await pendingRepository.findById(userId, id);
    if (!existing) {
      throw new PendingError("Pendencia nao encontrada.", 404);
    }
    if (existing.status !== "pendente") {
      throw new PendingError("Pendencias ja baixadas (pagas/recebidas) nao podem ser excluidas.", 409);
    }
    await pendingRepository.remove(userId, id);
  },

  async summary(userId: string) {
    return pendingRepository.summary(userId);
  },

  async settle(userId: string, id: string, paymentMethod: string) {
    const existing = await pendingRepository.findById(userId, id);
    if (!existing) {
      throw new PendingError("Pendencia nao encontrada.", 404);
    }
    if (existing.status !== "pendente") {
      throw new PendingError("Esta pendencia ja foi baixada.", 409);
    }

    const newStatus = existing.type === "receber" ? "recebido" : "pago";
    const category = SETTLE_CATEGORY[existing.type];

    try {
      return await pendingRepository.settle(userId, id, { newStatus, category, paymentMethod });
    } catch (err) {
      if (err instanceof Error && "statusCode" in err) {
        throw new PendingError(err.message, (err as any).statusCode);
      }
      throw err;
    }
  },
};
