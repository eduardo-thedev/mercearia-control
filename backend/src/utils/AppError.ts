// Erro base para qualquer regra de negocio que precisa virar uma resposta
// HTTP especifica (404, 409, etc). Services especializam com subclasses -
// o errorHandler so precisa saber sobre AppError, nao sobre cada subclasse.
export class AppError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "AppError";
  }
}
