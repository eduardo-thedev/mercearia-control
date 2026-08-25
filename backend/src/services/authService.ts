import { userRepository } from "../repositories/userRepository";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { generateResetToken, hashResetToken } from "../utils/resetToken";
import { sendPasswordResetEmail } from "./emailService";
import { env } from "../config/env";
import { PublicUser, User } from "../types";

export class AuthError extends AppError {}

function toPublicUser(user: User): PublicUser {
  const { password_hash, reset_token_hash, reset_token_expires_at, ...publicUser } = user;
  return publicUser;
}

function isEmailLike(identifier: string): boolean {
  return identifier.includes("@");
}

export const authService = {
  async register(input: { name: string; username: string; email: string; password: string }) {
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new AuthError("Ja existe uma conta com este e-mail.", 409);
    }

    const existingUsername = await userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new AuthError("Esse nome de usuario ja esta em uso.", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      username: input.username,
      email: input.email,
      passwordHash,
    });

    const token = signToken({ sub: user.id, email: user.email });
    return { user: toPublicUser(user), token };
  },

  // identifier pode ser o username ou o email - decide qual buscar pelo
  // formato, assim quem ainda nao tem username (contas antigas) continua
  // logando por email normalmente.
  async login(input: { identifier: string; password: string }) {
    const user = isEmailLike(input.identifier)
      ? await userRepository.findByEmail(input.identifier)
      : await userRepository.findByUsername(input.identifier);

    if (!user) {
      throw new AuthError("Usuario ou senha invalidos.", 401);
    }

    const valid = await comparePassword(input.password, user.password_hash);
    if (!valid) {
      throw new AuthError("Usuario ou senha invalidos.", 401);
    }

    const token = signToken({ sub: user.id, email: user.email });
    return { user: toPublicUser(user), token };
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AuthError("Usuario nao encontrado.", 404);
    }
    return toPublicUser(user);
  },

  // Sempre "sucesso" do ponto de vista do chamador, exista ou nao o e-mail -
  // evita que alguem descubra quais e-mails tem conta so tentando resetar.
  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return;

    const { token, hash, expiresAt } = generateResetToken();
    await userRepository.setResetToken(user.id, hash, expiresAt);

    const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashResetToken(token);
    const user = await userRepository.findByValidResetTokenHash(tokenHash);
    if (!user) {
      throw new AuthError("Link invalido ou expirado. Peca um novo.", 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePasswordAndClearResetToken(user.id, passwordHash);
  },
};
