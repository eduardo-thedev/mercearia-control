import { Pool, QueryResultRow, types } from "pg";
import { env } from "./env";

// Por padrao o driver pg converte a coluna DATE (OID 1082) num Date do JS,
// que vira timestamp completo ao serializar ("2026-08-20T00:00:00.000Z").
// O resto do app (filtros, <input type="date">, formatDateDisplay) espera
// "AAAA-MM-DD" puro, entao desliga essa conversao aqui.
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Erro inesperado no pool do Postgres:", err);
});

export async function query<T extends QueryResultRow = any>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params as any[]);
}
