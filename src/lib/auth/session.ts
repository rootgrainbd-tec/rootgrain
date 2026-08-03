import { randomBytes, createHash } from 'crypto';

/**
 * Generates a 256-bit cryptographically secure random session token.
 * This is the raw token that will be sent to the user in a secure HttpOnly cookie.
 * @returns The raw session token as a hex string.
 */
export function generateSessionToken(): string {
  // 32 bytes = 256 bits
  return randomBytes(32).toString('hex');
}

/**
 * Hashes a raw session token using SHA-256 for secure storage in the database.
 * @param token The raw session token.
 * @returns The SHA-256 hash of the token as a hex string.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
