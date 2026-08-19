import "server-only";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors/AppError";
import { PaymentMethod, PaymentType, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class PaymentService {
  /**
   * Records a payment against an order with strict idempotency and financial constraints.
   */
  static async recordPayment(params: {
    orderId: string;
    amount: number;
    type: PaymentType;
    method: PaymentMethod;
    reference?: string;
    idempotencyKey: string;
  }) {
    // 2. Require Admin & Derive actor server-side
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      throw new AppError("Unauthorized: Admin access required", 401);
    }
    const recordedById = session.user.id;

    const { orderId, amount, type, method, reference, idempotencyKey } = params;

    // 1. Validate request shape
    if (amount <= 0) {
      throw new AppError("Payment amount must be greater than 0", 400);
    }
    if (!orderId) {
      throw new AppError("Missing order ID", 400);
    }

    // Reference uniqueness constraint logic (digital methods only)
    const isDigitalMethod = method === "MANUAL_BKASH" || method === "BANK_TRANSFER";
    if (isDigitalMethod && !reference) {
      throw new AppError("Digital payment methods require a transaction reference", 400);
    }

    // 4. Construct normalized fingerprint
    const fingerprint = `${orderId}:${amount}:${type}:${method}:${reference || ""}`;

    // 5. Begin $transaction
    return await prisma.$transaction(async (tx) => {
      // 6. Claim IdempotencyKey
      const existingKey = await tx.idempotencyKey.findUnique({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: recordedById,
            scope: "record_payment",
            key: idempotencyKey
          }
        }
      });

      if (existingKey) {
        if (existingKey.fingerprint !== fingerprint) {
           throw new AppError("Idempotency fingerprint mismatch", 409);
        }
        if (existingKey.status === "COMPLETED") {
           return existingKey.responsePayload;
        }
        if (existingKey.status === "IN_PROGRESS") {
           throw new AppError("Concurrent payment request in progress", 409);
        }
      }

      await tx.idempotencyKey.upsert({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: recordedById,
            scope: "record_payment",
            key: idempotencyKey
          }
        },
        create: {
          ownerType: "USER",
          ownerId: recordedById,
          scope: "record_payment",
          key: idempotencyKey,
          fingerprint,
          status: "IN_PROGRESS"
        },
        update: {}
      });

      // 7. Lock Order: SELECT FOR UPDATE
      const order = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!order || order.length === 0) {
        throw new AppError("Order not found", 404);
      }
      const currentOrder = order[0];

      // Verify order status
      if (currentOrder.status === "CANCELLED" || currentOrder.status === "REJECTED") {
        throw new AppError("Cannot record payment for a cancelled or rejected order", 400);
      }

      // 10. Check method-scoped reference uniqueness for digital methods
      if (isDigitalMethod && reference) {
        const existingClaim = await tx.paymentReferenceClaim.findUnique({
          where: {
            method_reference: {
              method,
              reference
            }
          }
        });

        if (existingClaim) {
          throw new AppError(`Duplicate reference: This ${method} transaction has already been claimed on order ${existingClaim.orderId}`, 409);
        }
      }

      // 11. Compute constraints: Ensure advancePaid + amount <= total (prevent overpayment)
      const currentAdvancePaid = currentOrder.advancePaid;
      const total = currentOrder.total;

      if (currentAdvancePaid + amount > total) {
        throw new AppError("Payment amount exceeds remaining balance", 400);
      }

      // 12. Insert PaymentRecord
      const paymentRecord = await tx.paymentRecord.create({
        data: {
          orderId,
          amount,
          type,
          method,
          reference: reference || null,
          recordedById,
          status: "COMPLETED",
          paidAt: new Date()
        }
      });

      // 13. If digital method, insert PaymentReferenceClaim
      if (isDigitalMethod && reference) {
        await tx.paymentReferenceClaim.create({
          data: {
            reference,
            method,
            orderId
          }
        });
      }

      // 14. Update Order.advancePaid
      const allCompletedRecords = await tx.paymentRecord.findMany({
        where: {
          orderId,
          status: "COMPLETED"
        }
      });
      
      const newAdvancePaid = currentOrder.legacyAdvancePaid + allCompletedRecords.reduce((sum, record) => sum + record.amount, 0);

      // 15. Update Order.balanceDue
      const newBalanceDue = total - newAdvancePaid;

      await tx.order.update({
        where: { id: orderId },
        data: {
          advancePaid: newAdvancePaid,
          balanceDue: newBalanceDue
        }
      });

      // 17. Emit PaymentRecordedEvent
      const orderEventCount = await tx.orderEvent.count({ where: { orderId } });
      const orderEvent = await tx.orderEvent.create({
        data: {
          orderId,
          sequence: orderEventCount + 1,
          eventType: "PAYMENT_RECORDED",
          payload: {
            paymentRecordId: paymentRecord.id,
            amount,
            method,
            reference
          },
          actor: { id: recordedById, role: "ADMIN" }
        }
      });

      // 18. Generate Receipt Document Outbox trigger
      await tx.orderDocument.create({
        data: {
          orderId,
          documentType: "PAYMENT_RECEIPT",
          referenceIdentity: paymentRecord.id,
          snapshot: { amount, type, method, reference, paidAt: paymentRecord.paidAt },
          templateVersion: "1.0",
          createdBy: recordedById
        }
      });

      // 19. Trigger Notification Outbox
      await tx.notificationOutbox.create({
        data: {
          eventReference: orderEvent.id,
          orderId,
          notificationType: "PAYMENT_RECEIVED",
          channel: "EMAIL",
          status: "PENDING"
        }
      });

      // 20. Mark IdempotencyKey COMPLETED
      await tx.idempotencyKey.update({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: recordedById,
            scope: "record_payment",
            key: idempotencyKey
          }
        },
        data: {
          status: "COMPLETED",
          resultReference: paymentRecord.id,
          responsePayload: paymentRecord as any
        }
      });

      return paymentRecord;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
    });
  }
}
