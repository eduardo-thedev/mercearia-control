export interface User {
  id: string;
  name: string;
  username: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "entrada" | "saida";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  date: string;
  notes: string | null;
  pending_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionInput {
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  date: string;
  notes?: string | null;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  payment_method?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface TransactionSummary {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
}

export type PendingType = "receber" | "pagar";
export type PendingStoredStatus = "pendente" | "pago" | "recebido";
export type PendingEffectiveStatus = PendingStoredStatus | "vencido";

export interface PendingTransaction {
  id: string;
  user_id: string;
  type: PendingType;
  person_id: string;
  person_name: string;
  person_phone: string | null;
  description: string;
  amount: number;
  due_date: string;
  status: PendingStoredStatus;
  effective_status: PendingEffectiveStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingInput {
  type: PendingType;
  person_id: string;
  description: string;
  amount: number;
  due_date: string;
  notes?: string | null;
}

export interface PendingFilters {
  type?: PendingType;
  status?: PendingEffectiveStatus;
  person_id?: string;
  from?: string;
  to?: string;
}

export interface PendingSummary {
  totalReceber: number;
  totalPagar: number;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonInput {
  name: string;
  phone?: string | null;
}

// So vem preenchido quando a pessoa vem da listagem (GET /people) - um
// find/create/update isolado nao traz o total agregado.
export interface PersonWithTotals extends Person {
  total_receber_aberto: number;
  total_pagar_aberto: number;
}

export interface MonthlyReport {
  month: string;
  totalEntradas: number;
  totalSaidas: number;
  resultado: number;
  totalReceber: number;
  totalPagar: number;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
}

export interface EvolutionPoint {
  month: string;
  entradas: number;
  saidas: number;
  saldo: number;
}
