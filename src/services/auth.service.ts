import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { SessionService } from '@/services/session.service';
import { logAuthEvent, AuthProvider, LoginFailureReason } from '@/lib/auth/audit';
import { User } from '@prisma/client';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export class AuthService {
  /**
   * Registers a new user with Email/Password.
   */
  static async register(data: { name: string; email: string; password: string; phone?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      // Don't leak existence directly, but throw an error the router handles generically
      throw new Error('Registration failed');
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
      },
    });

    // Create a credentials account link
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'credentials',
        provider: AuthProvider.CREDENTIALS,
        providerAccountId: user.email!,
      },
    });

    // Send Verification Email
    await this.sendVerificationEmail(user.email!);

    return user;
  }

  /**
   * Logs a user in, enforces lockout policies, and returns a raw session token if successful.
   */
  static async login(email: string, password: string, ipAddress: string, userAgent: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      logAuthEvent({ email, ipAddress, userAgent, authMethod: AuthProvider.CREDENTIALS, success: false, failureReason: LoginFailureReason.INVALID_CREDENTIALS });
      return { success: false, error: 'Invalid email or password' };
    }

    // Check Lockout
    // @ts-ignore
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      logAuthEvent({ userId: user.id, email, ipAddress, userAgent, authMethod: AuthProvider.CREDENTIALS, success: false, failureReason: LoginFailureReason.ACCOUNT_LOCKED });
      return { success: false, error: 'Account locked. Please try again later or reset your password.' };
    }

    // Check if Credentials login is allowed (has password)
    if (!user.passwordHash) {
      logAuthEvent({ userId: user.id, email, ipAddress, userAgent, authMethod: AuthProvider.CREDENTIALS, success: false, failureReason: LoginFailureReason.MISSING_IDENTITY });
      return { success: false, error: 'Please log in with Google to access this account.' };
    }

    // Verify Password
    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      // @ts-ignore
      const newAttempts = (user.failedAttempts || 0) + 1;
      const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 mins

      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: newAttempts, lockedUntil } as any,
      });

      logAuthEvent({ userId: user.id, email, ipAddress, userAgent, authMethod: AuthProvider.CREDENTIALS, success: false, failureReason: LoginFailureReason.INVALID_CREDENTIALS });
      
      if (lockedUntil) {
        return { success: false, error: 'Account locked due to too many failed attempts.' };
      }
      return { success: false, error: 'Invalid email or password' };
    }

    // Success! Reset attempts and generate session
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null } as any,
    });

    const sessionToken = await SessionService.createSession(user.id, false); // RememberMe will be wired later

    logAuthEvent({ userId: user.id, email, ipAddress, userAgent, authMethod: AuthProvider.CREDENTIALS, success: true });

    return { success: true, token: sessionToken, user };
  }

  /**
   * Resends verification email.
   */
  static async sendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return;

    // Delete any existing tokens
    await prisma.verificationToken.deleteMany({ where: { identifier: user.email! } });

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: user.email!,
        token,
        expires: expires,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyLink = `${baseUrl}/verify-email?token=${token}`;
    await sendVerificationEmail(email, verifyLink);
  }

  /**
   * Verifies a user's email.
   */
  static async verifyEmail(token: string) {
    const verificationToken = await prisma.verificationToken.findUnique({ where: { token } });
    if (!verificationToken) {
      throw new Error('Invalid or expired token');
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      throw new Error('Invalid or expired token');
    }

    // Update user
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Clean up token
    await prisma.verificationToken.delete({ where: { token } });
  }

  /**
   * Initiates a password reset.
   */
  static async initiatePasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent return for enumeration protection

    // Delete existing reset tokens
    await prisma.passwordResetToken.deleteMany({ where: { email: user.email! } });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.passwordResetToken.create({
      data: {
        email: user.email!,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);
  }

  /**
   * Resets password using a token.
   */
  static async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken) {
      throw new Error('Invalid or expired token');
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new Error('Invalid or expired token');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { 
        passwordHash,
        failedAttempts: 0, // Unlock account on reset
        lockedUntil: null
      } as any,
    });

    // Clean up all active sessions since password changed
    const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
    if (user) {
      await SessionService.revokeAllSessions(user.id);
    }

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
  }
}
