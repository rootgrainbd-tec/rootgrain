import "server-only";
import prisma from "@/lib/prisma";
import { Order, OrderItem, Prisma } from "@prisma/client";

export class OrderRepository {
  static async createOrder(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: { items: true },
    });
  }

  static async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { 
        items: true, 
        user: { select: { id: true, name: true, email: true } } 
      },
    });
  }

  static async getOrderByNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
  }

  static async updateOrder(id: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  }
}
