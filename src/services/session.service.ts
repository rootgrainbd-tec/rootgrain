import prisma from '@/lib/prisma';
import { generateSessionToken, hashSessionToken } from '@/lib/auth/session';

const STANDARD_SESSION_HOURS = 24;
const EXTENDED_SESSION_DAYS = 30;

export class SessionService {
  /**
   * Creates a new session in the database.
   * Generates a secure random 256-bit token, hashes it for DB storage,
   * and returns the raw token to be set in the cookie.
   */
  static async createSession(userId: string, rememberMe: boolean = false): Promise<string> {
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    const expiresAt = new Date();
    if (rememberMe) {
      expiresAt.setDate(expiresAt.getDate() + EXTENDED_SESSION_DAYS);
    } else {
      expiresAt.setHours(expiresAt.getHours() + STANDARD_SESSION_HOURS);
    }

    await prisma.session.create({
      data: {
        sessionToken: tokenHash, // Store ONLY the SHA-256 hash
        userId,
        expires: expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Validates a raw session token from a cookie.
   * Extends the session expiration automatically if valid (Sliding Session).
   */
  static async validateSession(rawToken: string) {
    const tokenHash = hashSessionToken(rawToken);

    const session = await prisma.session.findUnique({
      where: { sessionToken: tokenHash },
      include: { user: true },
    });

    if (!session) return null;

    if (new Date() > session.expires) {
      // Session has expired, clean it up immediately
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // Sliding Expiration Strategy: Renew the session if it's halfway to expiration
    // For simplicity in Phase 1, we renew standard sessions daily.
    // We update 'expiresAt' in the DB here if needed.
    const now = new Date();
    const timeRemaining = session.expires.getTime() - now.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    
    if (timeRemaining < oneDay) {
      const newExpiresAt = new Date(now.getTime() + (STANDARD_SESSION_HOURS * 60 * 60 * 1000));
      await prisma.session.update({
        where: { id: session.id },
        data: { expires: newExpiresAt },
      });
      session.expires = newExpiresAt;
    }

    return session;
  }

  /**
   * Revokes a specific session by raw token (Logout)
   */
  static async revokeSession(rawToken: string): Promise<void> {
    const tokenHash = hashSessionToken(rawToken);
    try {
      await prisma.session.delete({
        where: { sessionToken: tokenHash },
      });
    } catch {
      // Idempotent: Ignore if it doesn't exist
    }
  }

  /**
   * Revokes all active sessions for a user (Global Logout)
   */
  static async revokeAllSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}
