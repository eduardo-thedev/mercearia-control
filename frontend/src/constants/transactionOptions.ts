// Espelho de backend/src/constants/transactionOptions.ts.
// Sem pacote compartilhado entre os dois projetos ainda - se mudar aqui,
// muda tambem no backend.

export const ENTRADA_CATEGORIES = [
  "Venda",
  "Pix",
  "Dinheiro",
  "Cartão",
  "Recebimento de pendência",
  "Outros",
] as const;

export const SAIDA_CATEGORIES = [
  "Compra de mercadoria",
  "Fornecedor",
  "Aluguel",
  "Energia",
  "Água",
  "Internet",
  "Funcionários",
  "Impostos",
  "Manutenção",
  "Outros",
] as const;

export const PAYMENT_METHODS = [
  "Dinheiro",
  "Pix",
  "Débito",
  "Crédito",
  "Transferência",
  "Outros",
] as const;

export function categoriesForType(type: "entrada" | "saida"): readonly string[] {
  return type === "entrada" ? ENTRADA_CATEGORIES : SAIDA_CATEGORIES;
}
