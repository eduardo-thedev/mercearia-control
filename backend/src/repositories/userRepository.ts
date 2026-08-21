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
};
