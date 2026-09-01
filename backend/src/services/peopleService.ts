import { peopleRepository } from "../repositories/peopleRepository";
import { AppError } from "../utils/AppError";
import { PersonInput } from "../types";

export class PersonError extends AppError {}

export const peopleService = {
  async list(userId: string, q?: string) {
    return peopleRepository.list(userId, q);
  },

  async getById(userId: string, id: string) {
    const person = await peopleRepository.findById(userId, id);
    if (!person) {
      throw new PersonError("Pessoa nao encontrada.", 404);
    }
    return person;
  },

  async create(userId: string, input: PersonInput) {
    return peopleRepository.create(userId, input);
  },

  async update(userId: string, id: string, input: Partial<PersonInput>) {
    const existing = await peopleRepository.findById(userId, id);
    if (!existing) {
      throw new PersonError("Pessoa nao encontrada.", 404);
    }
    return peopleRepository.update(userId, id, input);
  },

  async remove(userId: string, id: string) {
    const existing = await peopleRepository.findById(userId, id);
    if (!existing) {
      throw new PersonError("Pessoa nao encontrada.", 404);
    }
    const pendingCount = await peopleRepository.countPending(userId, id);
    if (pendingCount > 0) {
      throw new PersonError(
        "Essa pessoa tem pendencias no historico e nao pode ser excluida.",
        409
      );
    }
    await peopleRepository.remove(userId, id);
  },

  // Usado pelo pendingService pra validar person_id antes de criar/editar
  // uma pendencia - sem isso, um user_id A poderia referenciar uma pessoa
  // do user_id B so adivinhando o id (a FK do banco nao pega isso sozinha,
  // porque nao inclui user_id na checagem).
  async assertBelongsToUser(userId: string, personId: string) {
    const person = await peopleRepository.findById(userId, personId);
    if (!person) {
      throw new PersonError("Cliente/fornecedor invalido.", 400);
    }
  },
};
