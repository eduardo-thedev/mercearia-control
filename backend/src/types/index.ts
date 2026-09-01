export interface User {
  id: string;
  name: string;
  username: string | null;
  email: string;
  password_hash: string;
  reset_token_hash: string | null;
  reset_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PublicUser = Omit<User, "password_hash" | "reset_token_hash" | "reset_token_expires_at">;

export type TransactionType = "entrada" | "saida";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  description: string;
  amount: string; // NUMERIC vem como string do pg - convertido na borda (controller)
  category: string;
  payment_method: string;
  date: string;
  notes: string | null;
  pending_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  payment_method?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export type PendingType = "receber" | "pagar";
export type PendingStoredStatus = "pendente" | "pago" | "recebido";
export type PendingEffectiveStatus = PendingStoredStatus | "vencido";

export interface PendingTransaction {
  id: string;
  user_id: string;
  type: PendingType;
  person_id: string;
  person_name: string; // vem do JOIN com people
  person_phone: string | null; // vem do JOIN com people
  description: string;
  amount: string; // NUMERIC vem como string do pg
  due_date: string;
  status: PendingStoredStatus;
  effective_status: PendingEffectiveStatus; // calculado na query, nao persistido
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingFilters {
  type?: PendingType;
  status?: PendingEffectiveStatus;
  person_id?: string;
  from?: string;
  to?: string;
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

// Totais em aberto agregados de pending_transactions - so presentes
// quando a pessoa vem da listagem (peopleRepository.list), nao de um
// find/create/update isolado.
export interface PersonWithTotals extends Person {
  total_receber_aberto: string;
  total_pagar_aberto: string;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

// Extensao do Express Request para carregar o usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
