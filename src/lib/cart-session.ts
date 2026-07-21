import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export const GUEST_CART_COOKIE_NAME = "guest_cart_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Generates a cryptographically strong server-side cartSessionId.
 * 256 bits of entropy encoded as base64url (43 characters).
 * No email, userId, or PII is included in this identifier.
 * 
 * Used exclusively for Guest Cart identity authorization.
 */
export function generateCartSessionId(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Gets the current guest cart session ID from cookies.
 */
export async function getGuestCartSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_CART_COOKIE_NAME)?.value || null;
}

/**
 * Sets a new guest cart session ID in cookies with strict security flags.
 */
export async function setGuestCartSessionId(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_CART_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Destroys the guest cart session cookie (used upon successful auth transition).
 */
export async function destroyGuestCartSessionId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_CART_COOKIE_NAME);
}
