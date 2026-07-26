import "server-only";
import crypto from "crypto";

/**
 * Generates a high-entropy cryptographically secure token for guest tracking.
 * @returns {string} 256-bit entropy token in base64url format.
 */
export function generateGuestTrackingToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Computes a deterministic SHA-256 hash of the given raw token.
 * @param {string} rawToken The raw capability token.
 * @returns {string} 64-character hexadecimal SHA-256 hash.
 */
export function hashGuestTrackingToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Verifies if the provided raw token matches the stored SHA-256 hash securely.
 * @param {string | undefined | null} rawToken The raw token provided by the client.
 * @param {string | undefined | null} storedHash The hash stored in the database.
 * @returns {boolean} True if tokens match, false otherwise.
 */
export function verifyGuestTrackingToken(
  rawToken: string | undefined | null,
  storedHash: string | undefined | null
): boolean {
  if (!rawToken || !storedHash) return false;
  if (typeof rawToken !== 'string' || typeof storedHash !== 'string') return false;
  
  // Validate hash length (SHA-256 hex output is exactly 64 characters)
  if (storedHash.length !== 64) return false;

  let expectedHashBuffer: Buffer;
  try {
    expectedHashBuffer = Buffer.from(storedHash, 'hex');
    // Ensure conversion didn't result in incorrect length
    if (expectedHashBuffer.length !== 32) return false;
  } catch {
    return false;
  }
  
  const computedHashHex = hashGuestTrackingToken(rawToken);
  const computedHashBuffer = Buffer.from(computedHashHex, 'hex');
  
  try {
    return crypto.timingSafeEqual(computedHashBuffer, expectedHashBuffer);
  } catch {
    // Failsafe if lengths somehow differ
    return false;
  }
}
