// Listas da secao 5/6 do context.md. Se mudar aqui, muda tambem em
// frontend/src/constants/transactionOptions.ts (nao ha pacote compartilhado
// entre os dois projetos ainda).

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
