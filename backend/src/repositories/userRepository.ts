import { query } from "../config/database";
import { User } from "../types";

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] ?? null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const result = await query<User>("SELECT * FROM users WHERE username = $1", [username]);
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await query<User>("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async create(data: { name: string; username: string; email: string; passwordHash: string }): Promise<User> {
    const result = await query<User>(
      `INSERT INTO users (name, username, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.username, data.email, data.passwordHash]
    );
    return result.rows[0];
  },

  async setResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await query("UPDATE users SET reset_token_hash = $1, reset_token_expires_at = $2 WHERE id = $3", [
      tokenHash,
      expiresAt,
      userId,
    ]);
  },

  // So retorna se o token bate E ainda nao expirou - filtro direto na query
  async findByValidResetTokenHash(tokenHash: string): Promise<User | null> {
    const result = await query<User>(
      "SELECT * FROM users WHERE reset_token_hash = $1 AND reset_token_expires_at > now()",
      [tokenHash]
    );
    return result.rows[0] ?? null;
  },

  async updatePasswordAndClearResetToken(userId: string, passwordHash: string): Promise<void> {
    await query(
      `UPDATE users
       SET password_hash = $1, reset_token_hash = NULL, reset_token_expires_at = NULL, updated_at = now()
       WHERE id = $2`,
      [passwordHash, userId]
    );
  },
};
