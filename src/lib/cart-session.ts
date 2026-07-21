import { randomBytes } from "crypto";

/**
 * Generates a cryptographically strong server-side cartSessionId.
 * No email, userId, or PII is included in this identifier.
 * 
 * Used exclusively for Guest Cart identity authorization.
 */
export function generateCartSessionId(): string {
  return randomBytes(32).toString("hex");
}
