import { userRepository } from "../repositories/userRepository";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { PublicUser, User } from "../types";

export class AuthError extends AppError {}

function toPublicUser(user: User): PublicUser {
  const { password_hash, ...publicUser } = user;
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
};
