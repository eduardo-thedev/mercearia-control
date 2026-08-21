import { transactionRepository } from "../repositories/transactionRepository";
import { AppError } from "../utils/AppError";
import { TransactionFilters, TransactionType } from "../types";

export class TransactionError extends AppError {}

interface TransactionInput {
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  date: string;
  notes?: string | null;
}

export const transactionService = {
  async list(userId: string, filters: TransactionFilters) {
    return transactionRepository.list(userId, filters);
  },

  async getById(userId: string, id: string) {
    const transaction = await transactionRepository.findById(userId, id);
    if (!transaction) {
      throw new TransactionError("Lancamento nao encontrado.", 404);
    }
    return transaction;
  },

  async create(userId: string, input: TransactionInput) {
    return transactionRepository.create(userId, input);
  },

  async update(userId: string, id: string, input: Partial<TransactionInput>) {
    const existing = await transactionRepository.findById(userId, id);
    if (!existing) {
      throw new TransactionError("Lancamento nao encontrado.", 404);
    }

    // Nao deixa editar um lancamento que veio de uma baixa de pendencia,
    // pra nao dessincronizar do registro de pendencia (regra da secao 13)
    if (existing.pending_transaction_id) {
      throw new TransactionError(
        "Este lancamento foi gerado pela baixa de uma pendencia e nao pode ser editado diretamente.",
        409
      );
    }

    return transactionRepository.update(userId, id, input);
  },

  async remove(userId: string, id: string) {
    const existing = await transactionRepository.findById(userId, id);
    if (!existing) {
      throw new TransactionError("Lancamento nao encontrado.", 404);
    }

    if (existing.pending_transaction_id) {
      throw new TransactionError(
        "Este lancamento foi gerado pela baixa de uma pendencia e nao pode ser excluido diretamente.",
        409
      );
    }

    await transactionRepository.remove(userId, id);
  },

  async summary(userId: string, range: { from?: string; to?: string }) {
    return transactionRepository.summary(userId, range);
  },
};
