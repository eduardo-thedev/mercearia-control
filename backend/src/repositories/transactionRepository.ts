import { query } from "../config/database";
import { Transaction, TransactionFilters, TransactionType } from "../types";

interface CreateTransactionInput {
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  date: string;
  notes?: string | null;
}

type UpdateTransactionInput = Partial<CreateTransactionInput>;

// Monta WHERE dinamico com base nos filtros presentes, sempre escopado a
// user_id (nunca deixa um usuario ver dado de outro - secao 21 do context.md)
function buildWhere(userId: string, filters: TransactionFilters) {
  const clauses: string[] = ["user_id = $1"];
  const params: unknown[] = [userId];

  if (filters.type) {
    params.push(filters.type);
    clauses.push(`type = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    clauses.push(`category = $${params.length}`);
  }
  if (filters.payment_method) {
    params.push(filters.payment_method);
    clauses.push(`payment_method = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    clauses.push(`date >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    clauses.push(`date <= $${params.length}`);
  }

  return { where: clauses.join(" AND "), params };
}

export const transactionRepository = {
  async list(userId: string, filters: TransactionFilters): Promise<Transaction[]> {
    const { where, params } = buildWhere(userId, filters);
    let sql = `SELECT * FROM transactions WHERE ${where} ORDER BY date DESC, created_at DESC`;
    if (filters.limit) {
      params.push(filters.limit);
      sql += ` LIMIT $${params.length}`;
    }
    const result = await query<Transaction>(sql, params);
    return result.rows;
  },

  async findById(userId: string, id: string): Promise<Transaction | null> {
    const result = await query<Transaction>(
      "SELECT * FROM transactions WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return result.rows[0] ?? null;
  },

  async create(userId: string, data: CreateTransactionInput): Promise<Transaction> {
    const result = await query<Transaction>(
      `INSERT INTO transactions (user_id, type, description, amount, category, payment_method, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        data.type,
        data.description,
        data.amount,
        data.category,
        data.payment_method,
        data.date,
        data.notes ?? null,
      ]
    );
    return result.rows[0];
  },

  async update(userId: string, id: string, data: UpdateTransactionInput): Promise<Transaction | null> {
    const fields: string[] = [];
    const params: unknown[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      params.push(value);
      fields.push(`${key} = $${params.length}`);
    }

    if (fields.length === 0) {
      return this.findById(userId, id);
    }

    fields.push("updated_at = now()");
    params.push(id, userId);

    const result = await query<Transaction>(
      `UPDATE transactions SET ${fields.join(", ")}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING *`,
      params
    );
    return result.rows[0] ?? null;
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await query("DELETE FROM transactions WHERE id = $1 AND user_id = $2", [id, userId]);
    return (result.rowCount ?? 0) > 0;
  },

  async summary(userId: string, filters: { from?: string; to?: string }) {
    const { where, params } = buildWhere(userId, filters);
    const result = await query<{ type: TransactionType; total: string }>(
      `SELECT type, COALESCE(SUM(amount), 0) as total FROM transactions WHERE ${where} GROUP BY type`,
      params
    );

    const totals = { entrada: 0, saida: 0 };
    for (const row of result.rows) {
      totals[row.type] = Number(row.total);
    }

    return {
      totalEntradas: totals.entrada,
      totalSaidas: totals.saida,
      saldo: totals.entrada - totals.saida,
    };
  },
};
