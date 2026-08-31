import "server-only";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors/AppError";
import { appendOrderEvent } from "@/lib/persistence/orderEvent";
import { logger } from "@/lib/logger";

export class DeliveryAdminService {
  /**
   * Marks a dispatched order as DELIVERED.
   * This is decoupled from financial settlement (balanceDue).
   * Safe to call idempotently.
   */
  static async markDelivered(orderId: string, actorId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock the order row
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // 2. Idempotency Check
      const idempotencyKeyStr = `delivery_order_${orderId}`;
      const existingKey = await tx.idempotencyKey.findUnique({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actorId,
            scope: "delivery",
            key: idempotencyKeyStr
          }
        }
      });

      if (existingKey) {
        logger.info(`Delivery action idempotent skip for order ${orderId}`);
        return { success: true, orderId: order.id, idempotent: true };
      }

      // 3. Validation: Must be strictly DISPATCHED. 
      // Do NOT check balanceDue.
      if (order.status === "CANCELLED" || order.status === "REJECTED") {
        throw new AppError(`Cannot deliver ${order.status} order`, 400);
      }
      
      if (order.status !== "DISPATCHED") {
        throw new AppError("Order must be DISPATCHED before delivery", 400);
      }

      // 4. Update states
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          deliveryState: "DELIVERED",
          trackingState: "DELIVERED",
        }
      });

      // 5. Create OrderEvent
      const event = await appendOrderEvent(
        tx,
        orderId,
        "ORDER_DELIVERED",
        {
          note: `Order ${order.orderNumber} delivered.`,
          balanceDue: order.balanceDue,
          total: order.total,
          trackingNumber: order.trackingNumber
        },
        { id: actorId, type: "ADMIN" }
      );

      // 6. Create NotificationOutbox
      await tx.notificationOutbox.create({
        data: {
          notificationType: "ORDER_DELIVERED",
          channel: "EMAIL",
          status: "PENDING",
          orderId: order.id,
          eventReference: event.id
        }
      });

      // 7. Register Idempotency Key
      await tx.idempotencyKey.create({
        data: {
          ownerType: "USER",
          ownerId: actorId,
          scope: "delivery",
          key: idempotencyKeyStr,
          fingerprint: idempotencyKeyStr
        }
      });

      logger.info(`Successfully marked order ${orderId} as DELIVERED.`);

      return { success: true, orderId: order.id, idempotent: false };
    });
  }
}
