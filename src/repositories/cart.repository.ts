import "server-only";
import prisma from "@/lib/prisma";
import { AbandonedCartStatus } from "@prisma/client";

export class CartRepository {
  static async findPendingCartByEmail(email: string) {
    return prisma.abandonedCart.findFirst({
      where: {
        email,
        status: "PENDING",
      },
    });
  }

  static async createAbandonedCart(email: string, cartItems: any) {
    return prisma.abandonedCart.create({
      data: {
        email,
        cartItems,
        status: "PENDING",
        lastActive: new Date(),
      },
    });
  }

  static async updateAbandonedCart(id: string, cartItems: any) {
    return prisma.abandonedCart.update({
      where: { id },
      data: {
        cartItems,
        lastActive: new Date(),
      },
    });
  }

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

  static async findAbandonedCartsBefore(cutoffTime: Date, limit: number = 20) {
    return prisma.abandonedCart.findMany({
      where: {
        status: "PENDING",
        lastActive: { lt: cutoffTime }
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
