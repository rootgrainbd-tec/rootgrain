import "server-only";
import prisma from "@/lib/prisma";
import { Prisma, AbandonedCartStatus } from "@prisma/client";
import { ValidCartIdentity, CartItem } from "@/types/cart";

export class CartRepository {
  /**
   * Authoritative lookup by guest session ID
   */
  static async findByCartSessionId(cartSessionId: string) {
    return prisma.abandonedCart.findUnique({
      where: { cartSessionId },
    });
  }

  /**
   * Authoritative lookup by authenticated user ID
   */
  static async findByUserId(userId: string) {
    return prisma.abandonedCart.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
    });
  }

  /**
   * Explicitly updates or creates a cart with a ValidCartIdentity.
   * Enforces that cartSessionId and userId are mutually exclusive.
   * Email is required for contact data persistence per current schema.
   */
  static async upsertCart(
    identity: ValidCartIdentity,
    cartItems: CartItem[],
    email: string
  ) {
    const isGuest = identity.kind === "guest";
    const cartSessionId = isGuest ? identity.cartSessionId : null;
    const userId = !isGuest ? identity.userId : null;

    if (isGuest) {
      return prisma.abandonedCart.upsert({
        where: { cartSessionId: identity.cartSessionId },
        update: {
          cartItems: cartItems as unknown as Prisma.InputJsonValue,
          email,
          lastActive: new Date(),
          isRecoveryEligible: Boolean(email),
        },
        create: {
          cartSessionId,
          userId: null,
          email,
          cartItems: cartItems as unknown as Prisma.InputJsonValue,
          status: "PENDING",
          lastActive: new Date(),
          isRecoveryEligible: Boolean(email),
        },
      });
    } else {
      // For authenticated cart, we find the first pending cart for this user
      // If none, we create one.
      if (!userId) throw new Error("Authenticated user ID missing");
      const existing = await this.findByUserId(userId);
      if (existing) {
        return prisma.abandonedCart.update({
          where: { id: existing.id },
          data: {
            cartItems: cartItems as unknown as Prisma.InputJsonValue,
            email,
            lastActive: new Date(),
            isRecoveryEligible: Boolean(email),
          }
        });
      } else {
        return prisma.abandonedCart.create({
          data: {
            cartSessionId: null,
            userId,
            email,
            cartItems: cartItems as unknown as Prisma.InputJsonValue,
            status: "PENDING",
            lastActive: new Date(),
            isRecoveryEligible: Boolean(email),
          }
        });
      }
    }
  }

  /**
   * Authoritative update to transfer guest cart to an authenticated user
   */
  static async claimGuestCart(cartId: string, userId: string) {
    return prisma.abandonedCart.update({
      where: { id: cartId },
      data: {
        userId,
        cartSessionId: null,
        lastActive: new Date()
      }
    });
  }

  /**
   * @deprecated (Legacy) - NON-AUTHORITATIVE
   * Do not use for ownership or authorization decisions.
   */
  static async findPendingCartByEmail(email: string) {
    return prisma.abandonedCart.findFirst({
      where: {
        email,
        status: "PENDING",
      },
    });
  }

  /**
   * @deprecated (Legacy) - NON-AUTHORITATIVE
   * Do not use for ownership or authorization decisions.
   */
  static async createAbandonedCart(email: string, cartItems: CartItem[]) {
    return prisma.abandonedCart.create({
      data: {
        email,
        cartItems: cartItems as unknown as Prisma.InputJsonValue,
        status: "PENDING",
        lastActive: new Date(),
        isRecoveryEligible: false,
      },
    });
  }

  /**
   * @deprecated (Legacy) - NON-AUTHORITATIVE
   */
  static async updateAbandonedCart(id: string, cartItems: CartItem[]) {
    return prisma.abandonedCart.update({
      where: { id },
      data: {
        cartItems: cartItems as unknown as Prisma.InputJsonValue,
        lastActive: new Date(),
      },
    });
  }

  /**
   * Legacy checkout integration. Can mark legacy carts.
   */
  static async markCartsAsRecovered(email: string) {
    return prisma.abandonedCart.updateMany({
      where: {
        email,
        status: { in: ["PENDING", "EMAIL_SENT"] },
      },
      data: {
        status: "RECOVERED",
      },
    });
  }

  /**
   * Explicit eligibility gate: Only processes isRecoveryEligible = true
   */
  static async findAbandonedCartsBefore(cutoffTime: Date, limit: number = 20) {
    return prisma.abandonedCart.findMany({
      where: {
        status: "PENDING",
        lastActive: { lt: cutoffTime },
        isRecoveryEligible: true, // H2 Mandatory Gate
      },
      take: limit
    });
  }

  static async updateCartStatus(id: string, status: AbandonedCartStatus) {
    return prisma.abandonedCart.update({
      where: { id },
      data: { status }
    });
  }
}
