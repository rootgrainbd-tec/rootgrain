import "server-only";
import { AuthRepository } from "@/repositories/auth.repository";
import { AppError, ValidationError } from "@/lib/errors/AppError";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export class AuthService {
  static async registerUser(data: { name?: string; email?: string; password?: string }) {
    const { name, email, password } = data;

    if (!name || !email || !password) {
      throw new ValidationError("Missing fields");
    }

    const existingUser = await AuthRepository.getUserByEmail(email);

    if (existingUser) {
      throw new ValidationError("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await AuthRepository.createUser({
      name,
      email,
      password: hashedPassword,
    });

    try {
      await AuthRepository.linkGuestOrdersToUser(email, user.id);
      logger.info({ email }, "Linked guest orders");
    } catch (e) {
      logger.error({ err: e }, "Failed to link guest orders");
    }

    return user;
  }

  static async initiatePasswordReset(email: string) {
    if (!email) {
      throw new ValidationError("Email is required");
    }

    const user = await AuthRepository.getUserByEmail(email);

    if (!user) {
      // Don't reveal if a user exists or not for security reasons
      return { message: "If an account exists, an email will be sent." };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await AuthRepository.deleteResetTokensByEmail(email);
    await AuthRepository.createResetToken(email, token, expiresAt);

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://rootgrain.bd"}/reset-password?token=${token}`;

    await sendPasswordResetEmail(email, resetLink);

    return { message: "If an account exists, an email will be sent." };
  }

  static async resetPassword(data: { token?: string; password?: string }) {
    const { token, password } = data;

    if (!token || !password) {
      throw new ValidationError("Missing required fields");
    }

    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    const resetToken = await AuthRepository.getResetToken(token);

    if (!resetToken) {
      throw new ValidationError("Invalid or expired token");
    }

    if (resetToken.expiresAt < new Date()) {
      await AuthRepository.deleteResetTokenById(resetToken.id);
      throw new ValidationError("Token has expired. Please request a new one.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await AuthRepository.updateUserPassword(resetToken.email, hashedPassword);
    await AuthRepository.deleteResetTokenById(resetToken.id);

    return { message: "Password updated successfully" };
  }
}
