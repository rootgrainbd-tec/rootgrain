/**
 * Centralized logic for determining if a user requires email verification.
 * Google OAuth users are inherently trusted by their identity provider,
 * so local email verification is bypassed.
 */
export function needsEmailVerification(user?: { emailVerified?: boolean | null | Date | string; provider?: string | null }) {
  if (!user) return false;
  
  // Google users are already verified by Google
  if (user.provider === "google") {
    return false;
  }
  
  // For credentials users, check the actual emailVerified flag
  return !user.emailVerified;
}
