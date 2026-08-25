import {
  User,
  Transaction,
  TransactionInput,
  TransactionFilters,
  TransactionSummary,
  PendingTransaction,
  PendingInput,
  PendingFilters,
  PendingSummary,
  MonthlyReport,
  CategoryBreakdownItem,
  EvolutionPoint,
  TransactionType,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // manda/recebe o cookie httpOnly do JWT
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error ?? "Erro na requisicao.", response.status);
  }

  return data as T;
}

function toQueryString(filters: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
    if (value) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  register: (input: { name: string; username: string; email: string; password: string }) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: { identifier: string; password: string }) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () => request<{ user: User }>("/auth/me"),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  transactions: {
    list: (filters: TransactionFilters = {}) =>
      request<{ transactions: Transaction[] }>(`/transactions${toQueryString(filters)}`),

    summary: (range: { from?: string; to?: string } = {}) =>
      request<TransactionSummary>(`/transactions/summary${toQueryString(range)}`),

    get: (id: string) => request<{ transaction: Transaction }>(`/transactions/${id}`),

    create: (input: TransactionInput) =>
      request<{ transaction: Transaction }>("/transactions", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    update: (id: string, input: Partial<TransactionInput>) =>
      request<{ transaction: Transaction }>(`/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),

    remove: (id: string) => request<void>(`/transactions/${id}`, { method: "DELETE" }),
  },

  pending: {
    list: (filters: PendingFilters = {}) =>
      request<{ pending: PendingTransaction[] }>(`/pending${toQueryString(filters)}`),

    summary: () => request<PendingSummary>("/pending/summary"),

    get: (id: string) => request<{ pending: PendingTransaction }>(`/pending/${id}`),

    create: (input: PendingInput) =>
      request<{ pending: PendingTransaction }>("/pending", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    update: (id: string, input: Partial<PendingInput>) =>
      request<{ pending: PendingTransaction }>(`/pending/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),

    remove: (id: string) => request<void>(`/pending/${id}`, { method: "DELETE" }),

    settle: (id: string, paymentMethod: string) =>
      request<{ pending: PendingTransaction; transactionId: string }>(`/pending/${id}/baixa`, {
        method: "POST",
        body: JSON.stringify({ payment_method: paymentMethod }),
      }),
  },

  reports: {
    monthly: (month: string) => request<MonthlyReport>(`/reports/monthly${toQueryString({ month })}`),

    categories: (month: string, type: TransactionType) =>
      request<{ categories: CategoryBreakdownItem[] }>(`/reports/categories${toQueryString({ month, type })}`),

    evolution: (months = 6) =>
      request<{ evolution: EvolutionPoint[] }>(`/reports/evolution${toQueryString({ months })}`),
  },
};

export { ApiError };
