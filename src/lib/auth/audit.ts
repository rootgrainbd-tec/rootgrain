import prisma from '@/lib/prisma';
import { AuthProvider, LoginFailureReason } from '@prisma/client';

export type AuditLogPayload = {
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  authMethod: AuthProvider;
  success: boolean;
  failureReason?: LoginFailureReason;
  sessionId?: string;
};

/**
 * Asynchronously logs an authentication event to the database.
 * This function handles its own errors and never throws, ensuring that
 * the core authentication flow is never blocked by an audit logging failure.
 */
export function logAuthEvent(payload: AuditLogPayload): void {
  // We explicitly do not await this promise to make it fire-and-forget.
  // In a Serverless environment like Vercel, `waitUntil` (from @vercel/functions)
  // or a background job queue (like Inngest) is preferred, but for now we catch
  // errors internally.
  Promise.resolve()
    .then(async () => {
      await prisma.loginAuditLog.create({
        data: payload,
      });
    })
    .catch((error) => {
      // Sensitive values are not logged here, just the operational error
      console.error('[AuditLogger] Failed to write audit log to database:', error);
    });
}
