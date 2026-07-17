import "server-only";
import { CartRepository } from "@/repositories/cart.repository";
import { logger } from "@/lib/logger";

export class CartService {
  static async syncCart(email: string, cartItems: any[]) {
    try {
      const existingCart = await CartRepository.findPendingCartByEmail(email);

      if (existingCart) {
        await CartRepository.updateAbandonedCart(existingCart.id, cartItems);
        logger.info({ email, cartId: existingCart.id }, "Updated existing abandoned cart");
      } else {
        const newCart = await CartRepository.createAbandonedCart(email, cartItems);
        logger.info({ email, cartId: newCart.id }, "Created new abandoned cart");
      }
    } catch (error) {
      logger.error({ err: error, email }, "Failed to sync cart");
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

      const cartsToRecover = await CartRepository.findAbandonedCartsBefore(cutoffTime, 20);

      if (cartsToRecover.length === 0) {
        return { success: true, message: "No abandoned carts to process." };
      }

      const processedIds = [];

      for (const cart of cartsToRecover) {
        const code = `COMEBACK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 3);

        await adminRepository.createCoupon({
          code,
          discountType: "PERCENTAGE",
          discountValue: settings.abandonedCartDiscountPercent,
          maxUses: 1,
          expiryDate: expiry
        });

        await sendAbandonedCartEmail(cart.email, cart.cartItems as any[], code, settings.abandonedCartDiscountPercent);

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
