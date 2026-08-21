import fs from "node:fs";
import path from "node:path";
import { pool } from "../config/database";

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Rodando schema.sql...");
  await pool.query(sql);
  console.log("Schema aplicado com sucesso.");

  await pool.end();
}

migrate().catch((err) => {
  console.error("Falha ao rodar migracao:", err);
  process.exit(1);
});
