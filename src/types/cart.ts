export interface CartItem {
  productId: string;
  quantity: number;
}

export type AuthenticatedCartIdentity = {
  kind: "authenticated";
  userId: string;
};

export type GuestCartIdentity = {
  kind: "guest";
  cartSessionId: string;
};

/**
 * NON-AUTHORITATIVE
 * Legacy email reference only for backward compatibility.
 * NEVER to be used for H2 ownership or authorization decisions.
 */
export type LegacyCartReference = {
  kind: "legacy";
  email: string;
};

export type ValidCartIdentity = AuthenticatedCartIdentity | GuestCartIdentity;
