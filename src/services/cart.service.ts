import "server-only";
import { randomBytes } from "crypto";
import { CartRepository } from "@/repositories/cart.repository";
import { logger } from "@/lib/logger";
import { ValidCartIdentity, CartItem } from "@/types/cart";

export class CartService {
  /**
   * Syncs a cart securely using the provided valid identity (authenticated or guest).
   */
  static async syncIdentityCart(identity: ValidCartIdentity, cartItems: CartItem[], email: string) {
    try {
      await CartRepository.upsertCart(identity, cartItems, email);
      logger.info({ kind: identity.kind }, "Synced identity cart");
    } catch (error) {
      logger.error({ err: error, kind: identity.kind }, "Failed to sync identity cart");
      throw error;
    }
  }

  /**
   * Safely claims a guest cart for an authenticated user, returning a deferred/conflict 
   * result if the user already has an active authenticated cart.
   * 
   * Business merge policy for dual-cart scenario is DEFERRED.
   */
  static async transitionGuestToAuthenticated(cartSessionId: string, userId: string) {
    try {
      const guestCart = await CartRepository.findByCartSessionId(cartSessionId);
      if (!guestCart) {
        return { success: true, status: "no_guest_cart" };
      }

      const existingAuthCart = await CartRepository.findByUserId(userId);
      if (existingAuthCart) {
        // Dual cart scenario: defer merge decision
        return { success: false, status: "conflict_merge_deferred" };
      }

      await CartRepository.claimGuestCart(guestCart.id, userId);
      return { success: true, status: "claimed" };
    } catch (error) {
      logger.error({ err: error, cartSessionId, userId }, "Failed to transition guest cart");
      throw error;
    }
  }

  /**
   * Resolves identity, normalizes cart items, handles guest->auth transitions,
   * and delegates to the repository.
   */
  static async processSyncRequest(
    cartItems: { productId: string; quantity: number }[],
    email: string
  ) {
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("@/lib/auth");
    const { 
      getGuestCartSessionId, 
      setGuestCartSessionId, 
      generateCartSessionId, 
      destroyGuestCartSessionId 
    } = await import("@/lib/cart-session");

    // 1. Normalize duplicate productIds
    const itemMap = new Map<string, number>();
    for (const item of cartItems) {
      const existingQty = itemMap.get(item.productId) || 0;
      const newQty = existingQty + item.quantity;
      itemMap.set(item.productId, newQty > 99 ? 99 : newQty);
    }
    const normalizedCartItems = Array.from(itemMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    // 2. Resolve Identity
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (userId) {
      // Authenticated Flow
      const guestSessionId = await getGuestCartSessionId();
      if (guestSessionId) {
        const transition = await this.transitionGuestToAuthenticated(guestSessionId, userId);
        if (transition.status === "claimed" || transition.status === "no_guest_cart") {
          await destroyGuestCartSessionId();
        }
      }
      
      await this.syncIdentityCart(
        { kind: "authenticated", userId },
        normalizedCartItems,
        email || ""
      );
    } else {
      // Guest Flow
      let guestSessionId = await getGuestCartSessionId();
      if (!guestSessionId) {
        guestSessionId = generateCartSessionId();
        await setGuestCartSessionId(guestSessionId);
      }

      await this.syncIdentityCart(
        { kind: "guest", cartSessionId: guestSessionId },
        normalizedCartItems,
        email || ""
      );
    }
  }

  static async processAbandonedCarts() {
    try {
      const { adminRepository } = await import("@/repositories/admin.repository");
      const { sendAbandonedCartEmail } = await import("@/lib/email");

      const settings = await adminRepository.getStoreSettings() || {
        abandonedCartDelayHours: 24,
        abandonedCartDiscountPercent: 5
      } as any;

      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - settings.abandonedCartDelayHours);

      // Only retrieves carts where isRecoveryEligible = true per H2
      const cartsToRecover = await CartRepository.findAbandonedCartsBefore(cutoffTime, 20);

      if (cartsToRecover.length === 0) {
        return { success: true, message: "No abandoned carts to process." };
      }

      const processedIds = [];

      for (const cart of cartsToRecover) {
        const randomString = randomBytes(3).toString("hex").toUpperCase();
        const code = `COMEBACK-${randomString}`;
        
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 3);

        await adminRepository.createCoupon({
          code,
          discountType: "PERCENTAGE",
          discountValue: settings.abandonedCartDiscountPercent,
          maxUses: 1,
          expiryDate: expiry
        });

        await sendAbandonedCartEmail(cart.email, cart.cartItems as unknown as CartItem[], code, settings.abandonedCartDiscountPercent);

        await CartRepository.updateCartStatus(cart.id, "EMAIL_SENT");

        processedIds.push(cart.id);
      }

      return { 
        success: true, 
        message: `Processed ${processedIds.length} abandoned carts.`,
        processedIds 
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to process abandoned carts");
      throw error;
    }
  }
}
