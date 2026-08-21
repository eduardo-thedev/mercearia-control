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
  person: string;
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
  person: string;
  description: string;
  amount: number;
  due_date: string;
  notes?: string | null;
}

export interface PendingFilters {
  type?: PendingType;
  status?: PendingEffectiveStatus;
  from?: string;
  to?: string;
}

export interface PendingSummary {
  totalReceber: number;
  totalPagar: number;
}
