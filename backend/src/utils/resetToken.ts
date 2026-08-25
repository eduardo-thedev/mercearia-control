import crypto from "node:crypto";

const TOKEN_BYTES = 32;
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// Token cru vai por e-mail (link), so o hash SHA-256 fica salvo no banco -
// mesmo raciocinio de nunca guardar segredo em texto puro. Um vazamento do
// banco sozinho nao permite usar nenhum link de reset ja emitido.
export function generateResetToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return { token, hash, expiresAt };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
