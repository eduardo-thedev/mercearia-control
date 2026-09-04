import { query, pool } from "../config/database";
import { PendingTransaction, PendingFilters, PendingType } from "../types";

interface CreatePendingInput {
  type: PendingType;
  person_id: string;
  description: string;
  amount: number;
  due_date: string;
  notes?: string | null;
}

type UpdatePendingInput = Partial<CreatePendingInput>;

// "vencido" nao e um valor persistido - e calculado a partir de due_date vs
// hoje, pra nao depender de um cron job atualizando status em segundo plano
// (secao 13 do context.md: "vencida quando data atual > vencimento e status
// ainda pendente"). Isso vira uma coluna computada na query.
const EFFECTIVE_STATUS_EXPR = `
  CASE
    WHEN pt.status = 'pendente' AND pt.due_date < CURRENT_DATE THEN 'vencido'
    ELSE pt.status
  END
`;

// person_name/person_phone vem do JOIN com people - pending_transactions
// so guarda o id (secao "pessoas" - ver schema.sql).
const SELECT_COLUMNS = `pt.*, p.name as person_name, p.phone as person_phone, (${EFFECTIVE_STATUS_EXPR}) as effective_status`;

function buildWhere(userId: string, filters: PendingFilters) {
  const clauses: string[] = ["pt.user_id = $1"];
  const params: unknown[] = [userId];

  if (filters.type) {
    params.push(filters.type);
    clauses.push(`pt.type = $${params.length}`);
  }
  if (filters.person_id) {
    params.push(filters.person_id);
    clauses.push(`pt.person_id = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    clauses.push(`pt.due_date >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    clauses.push(`pt.due_date <= $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    clauses.push(`(${EFFECTIVE_STATUS_EXPR}) = $${params.length}`);
  }

  return { where: clauses.join(" AND "), params };
}

export const pendingRepository = {
  async list(userId: string, filters: PendingFilters): Promise<PendingTransaction[]> {
    const { where, params } = buildWhere(userId, filters);
    const result = await query<PendingTransaction>(
      `SELECT ${SELECT_COLUMNS}
       FROM pending_transactions pt
       JOIN people p ON p.id = pt.person_id
       WHERE ${where}
       ORDER BY pt.due_date ASC, pt.created_at DESC`,
      params
    );
    return result.rows;
  },

  async findById(userId: string, id: string): Promise<PendingTransaction | null> {
    const result = await query<PendingTransaction>(
      `SELECT ${SELECT_COLUMNS}
       FROM pending_transactions pt
       JOIN people p ON p.id = pt.person_id
       WHERE pt.id = $1 AND pt.user_id = $2`,
      [id, userId]
    );
    return result.rows[0] ?? null;
  },

  async create(userId: string, data: CreatePendingInput): Promise<PendingTransaction> {
    const inserted = await query<{ id: string }>(
      `INSERT INTO pending_transactions (user_id, type, person_id, description, amount, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, data.type, data.person_id, data.description, data.amount, data.due_date, data.notes ?? null]
    );
    return (await this.findById(userId, inserted.rows[0].id))!;
  },

  async update(userId: string, id: string, data: UpdatePendingInput): Promise<PendingTransaction | null> {
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

    await query(
      `UPDATE pending_transactions SET ${fields.join(", ")}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}`,
      params
    );
    return this.findById(userId, id);
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await query("DELETE FROM pending_transactions WHERE id = $1 AND user_id = $2", [id, userId]);
    return (result.rowCount ?? 0) > 0;
  },

  // Soma so o que ainda esta em aberto (status = pendente no banco - inclui
  // o que esta "vencido" na visao computada, ja que vencido e so pendente
  // com due_date passado).
  async summary(userId: string) {
    const result = await query<{ type: PendingType; total: string }>(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM pending_transactions
       WHERE user_id = $1 AND status = 'pendente'
       GROUP BY type`,
      [userId]
    );

    const totals = { receber: 0, pagar: 0 };
    for (const row of result.rows) {
      totals[row.type] = Number(row.total);
    }

    return { totalReceber: totals.receber, totalPagar: totals.pagar };
  },

  // Baixa: atualiza status + cria a transaction vinculada numa unica
  // transacao de banco - se uma parte falhar, as duas revertem (secao 13:
  // "o sistema deve evitar duplicidade de lancamentos").
  async settle(
    userId: string,
    id: string,
    input: { newStatus: "pago" | "recebido"; category: string; paymentMethod: string }
  ): Promise<{ pending: PendingTransaction; transactionId: string }> {
    const client = await pool.connect();
    let transactionId: string;
    try {
      await client.query("BEGIN");

      const pendingResult = await client.query<{ status: string; type: PendingType; description: string; amount: string }>(
        `SELECT status, type, description, amount FROM pending_transactions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [id, userId]
      );
      const pending = pendingResult.rows[0];
      if (!pending) {
        throw Object.assign(new Error("Pendencia nao encontrada."), { statusCode: 404 });
      }
      if (pending.status !== "pendente") {
        throw Object.assign(new Error("Esta pendencia ja foi baixada."), { statusCode: 409 });
      }

      const txType = pending.type === "receber" ? "entrada" : "saida";
      const txResult = await client.query<{ id: string }>(
        `INSERT INTO transactions (user_id, type, description, amount, category, payment_method, date, pending_transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
         RETURNING id`,
        [userId, txType, pending.description, pending.amount, input.category, input.paymentMethod, id]
      );
      transactionId = txResult.rows[0].id;

      await client.query(
        `UPDATE pending_transactions SET status = $1, updated_at = now() WHERE id = $2 AND user_id = $3`,
        [input.newStatus, id, userId]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    const updated = (await this.findById(userId, id))!;
    return { pending: updated, transactionId };
  },
};
