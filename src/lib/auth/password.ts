import * as argon2 from 'argon2';

/**
 * Hashes a password using Argon2id with recommended secure defaults.
 * @param password The plaintext password to hash.
 * @returns The resulting Argon2 hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifies a plaintext password against a stored Argon2 hash.
 * Constant-time comparison is handled natively by the argon2 package.
 * @param hash The stored Argon2 hash string.
 * @param password The plaintext password to verify.
 * @returns True if the password matches the hash, false otherwise.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // If the hash format is invalid or another error occurs, fail securely
    return false;
  }
}
