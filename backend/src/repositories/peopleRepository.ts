import { query } from "../config/database";
import { Person, PersonInput, PersonWithTotals } from "../types";

type UpdatePersonInput = Partial<PersonInput>;

export const peopleRepository = {
  // Lista com o total em aberto de cada pessoa ja somado (LEFT JOIN +
  // FILTER), pra tela de Clientes nao precisar de uma chamada por pessoa.
  async list(userId: string, q?: string): Promise<PersonWithTotals[]> {
    const params: unknown[] = [userId];
    let searchClause = "";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      searchClause = `AND p.name ILIKE $${params.length}`;
    }

    const result = await query<PersonWithTotals>(
      `SELECT
         p.*,
         COALESCE(SUM(pt.amount) FILTER (WHERE pt.type = 'receber' AND pt.status = 'pendente'), 0) as total_receber_aberto,
         COALESCE(SUM(pt.amount) FILTER (WHERE pt.type = 'pagar' AND pt.status = 'pendente'), 0) as total_pagar_aberto
       FROM people p
       LEFT JOIN pending_transactions pt ON pt.person_id = p.id
       WHERE p.user_id = $1 ${searchClause}
       GROUP BY p.id
       ORDER BY p.name ASC`,
      params
    );
    return result.rows;
  },

  async findById(userId: string, id: string): Promise<Person | null> {
    const result = await query<Person>(`SELECT * FROM people WHERE id = $1 AND user_id = $2`, [id, userId]);
    return result.rows[0] ?? null;
  },

  async create(userId: string, data: PersonInput): Promise<Person> {
    const result = await query<Person>(
      `INSERT INTO people (user_id, name, phone) VALUES ($1, $2, $3) RETURNING *`,
      [userId, data.name, data.phone ?? null]
    );
    return result.rows[0];
  },

  async update(userId: string, id: string, data: UpdatePersonInput): Promise<Person | null> {
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

    const result = await query<Person>(
      `UPDATE people SET ${fields.join(", ")}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING *`,
      params
    );
    return result.rows[0] ?? null;
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await query("DELETE FROM people WHERE id = $1 AND user_id = $2", [id, userId]);
    return (result.rowCount ?? 0) > 0;
  },

  // Usado antes de excluir: nao deixa apagar uma pessoa que ainda tem
  // pendencia (aberta ou ja baixada) no historico, pra nao perder o
  // rastro de quem uma linha de pending_transactions se referia.
  async countPending(userId: string, id: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM pending_transactions WHERE user_id = $1 AND person_id = $2`,
      [userId, id]
    );
    return Number(result.rows[0].count);
  },
};
