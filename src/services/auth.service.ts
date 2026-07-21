import "server-only";
import { AuthRepository } from "@/repositories/auth.repository";
import { AppError, ValidationError } from "@/lib/errors/AppError";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail, sendLoginAttemptEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export class AuthService {
  static async registerUser(data: { name?: string; email?: string; password?: string }) {
    const { name, email, password } = data;

    if (!name || !email || !password) {
      throw new ValidationError("Missing fields");
    }

    const existingUser = await AuthRepository.getUserByEmail(email);

    if (existingUser) {
      if (existingUser.emailVerified) {
        // Enumeration protection: Send login attempt email instead of token
        await sendLoginAttemptEmail(email);
        return { message: "If the email is valid, a verification link has been sent." };
      }
      // If user exists but isn't verified, we can just resend a verification token
      // or update their password if they are trying to register again.
      // For safety, let's update their password and send a new token.
      const hashedPassword = await bcrypt.hash(password, 10);
      await AuthRepository.updateUserPassword(email, hashedPassword);
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await AuthRepository.createUser({
        name,
        email,
        password: hashedPassword,
      });
    }

    // Generate secure token (256-bit entropy)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await AuthRepository.deleteVerificationTokensByIdentifier(email);
    await AuthRepository.createVerificationToken(email, token, expires);

    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://rootgrain.bd"}/api/auth/verify?token=${token}`;
    await sendVerificationEmail(email, verifyLink);

    return { message: "If the email is valid, a verification link has been sent." };
  }

  static async verifyEmail(token: string) {
    if (!token) {
      throw new ValidationError("Token is required");
    }

    const verificationToken = await AuthRepository.getVerificationToken(token);

    if (!verificationToken) {
      throw new ValidationError("Invalid or expired token");
    }

    if (verificationToken.expires < new Date()) {
      await AuthRepository.deleteVerificationToken(token);
      throw new ValidationError("Invalid or expired token");
    }

    // Atomic verify and delete
    await AuthRepository.verifyUserEmail(verificationToken.identifier);
    await AuthRepository.deleteVerificationToken(token);
    
    // Link guest orders now that email is verified
    try {
      const user = await AuthRepository.getUserByEmail(verificationToken.identifier);
      if (user) {
        await AuthRepository.linkGuestOrdersToUser(user.email!, user.id);
        logger.info({ email: user.email }, "Linked guest orders after email verification");
      }
    } catch (e) {
      logger.error({ err: e, email: verificationToken.identifier }, "Failed to link guest orders");
    }

    return { message: "Email verified successfully" };
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
