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
   * @deprecated Kept for public route backward compatibility.
   * Will be hardened in A3 to use proper ValidCartIdentity.
   */
  static async syncCart(email: string, cartItems: CartItem[]) {
    try {
      const existingCart = await CartRepository.findPendingCartByEmail(email);

      if (existingCart) {
        await CartRepository.updateAbandonedCart(existingCart.id, cartItems);
        logger.info({ email, cartId: existingCart.id }, "Updated existing abandoned cart (legacy)");
      } else {
        const newCart = await CartRepository.createAbandonedCart(email, cartItems);
        logger.info({ email, cartId: newCart.id }, "Created new abandoned cart (legacy)");
      }
    } catch (error) {
      logger.error({ err: error, email }, "Failed to sync cart (legacy)");
      throw error;
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
