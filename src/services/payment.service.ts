import "server-only";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors/AppError";
import { PaymentMethod, PaymentType, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inngest } from "@/inngest/client";
import { getSiteConfig } from "@/data/site-config";
import { appendOrderEvent } from "@/lib/persistence/orderEvent";
import { scheduleNotification } from "@/lib/persistence/outbox";

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
    invoiceDocumentId?: string;
    idempotencyKey: string;
    actorId?: string; // Internal/testing override
  }) {
    const { orderId, amount, type, method, reference, invoiceDocumentId, idempotencyKey, actorId } = params;

    let recordedById = actorId;
    if (!recordedById) {
      // 2. Require Admin & Derive actor server-side
      const session = await getServerSession(authOptions);
      if (!session || !session.user || (session.user as any).role !== "ADMIN") {
        throw new AppError("Unauthorized: Admin access required", 401);
      }
      recordedById = session.user.id;
    }

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

    // 4. Construct normalized fingerprint (adding invoiceDocumentId to avoid conflicts)
    const fingerprint = `${orderId}:${amount}:${type}:${method}:${reference || ""}:${invoiceDocumentId || ""}`;

    // 5. Begin $transaction
    let generatedReceiptId: string | null = null;
    let outboxIdForEmail: string | null = null;
    const paymentRecord = await prisma.$transaction(async (tx) => {
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

      // --- NEW SLICE 5 VALIDATION ---
      if (currentOrder.isMtoOrder) {
        if (!invoiceDocumentId) {
          throw new AppError("MTO Orders require an invoiceDocumentId for payments.", 400);
        }

        const invoice = await tx.orderDocument.findUnique({
          where: { id: invoiceDocumentId }
        });

        if (!invoice) throw new AppError("Invoice not found", 404);
        if (invoice.orderId !== currentOrder.id) throw new AppError("Invoice belongs to a different order", 400);
        if (invoice.documentType !== "INVOICE") throw new AppError("Provided document is not an invoice", 400);
        if ((invoice.snapshot as any)?.invoiceType !== "ADVANCE") throw new AppError("Only ADVANCE invoices are supported for this payment", 400);
        if (invoice.status !== "ISSUED") throw new AppError("Invoice must be in ISSUED state", 400);
      }
      // -----------------------------

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
          invoiceDocumentId: invoiceDocumentId || null,
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
      const orderEvent = await appendOrderEvent(tx, orderId, "PAYMENT_RECORDED", {
        paymentRecordId: paymentRecord.id,
        amount,
        method,
        reference
      }, { id: recordedById, role: "ADMIN" });


      // 18. Generate Receipt Document Outbox trigger
      const siteConfig = await getSiteConfig();
      const receiptSnapshot = {
        amount,
        type,
        method,
        reference,
        paidAt: paymentRecord.paidAt,
        customerName: (currentOrder.shippingAddress as any)?.name || "Customer",
        branding: {
          companyName: siteConfig.name,
          address: siteConfig.address,
          email: siteConfig.support.email,
          phone: siteConfig.support.phone.display,
        }
      };

      const receiptDoc = await tx.orderDocument.create({
        data: {
          orderId,
          documentType: "PAYMENT_RECEIPT",
          referenceIdentity: `RCT-${paymentRecord.id}`,
          snapshot: receiptSnapshot,
          templateVersion: "1.0",
          createdBy: recordedById
        }
      });
      generatedReceiptId = receiptDoc.id;

      // 19. Trigger Notification Outbox
      const outbox = await scheduleNotification(tx, orderId, orderEvent.id, "PAYMENT_RECEIPT", "EMAIL");
      outboxIdForEmail = outbox.id;

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

    if (generatedReceiptId) {
      await inngest.send({
        name: "document/generation.requested",
        data: {
          orderDocumentId: generatedReceiptId,
          documentType: "PAYMENT_RECEIPT"
        }
      });
    }

    if (outboxIdForEmail) {
      await inngest.send({
        name: "communication/email.requested",
        data: { outboxId: outboxIdForEmail }
      });
    }

    return paymentRecord;
  }

  /**
   * Voids a payment against an order with strict idempotency, concurrency safety,
   * and authoritative financial recalculation.
   *
   * State Machine:
   *   INITIATED  → VOIDED (zero financial delta)
   *   COMPLETED  → VOIDED (full financial recalculation)
   *   FAILED     → REJECTED
   *   REFUNDED   → REJECTED
   *   VOIDED     → REJECTED
   *
   * Lock Order: IdempotencyKey → Order (FOR UPDATE) → PaymentRecord (update)
   */
  static async voidPayment(params: {
    paymentRecordId: string;
    idempotencyKey: string;
  }) {
    const { paymentRecordId, idempotencyKey } = params;

    // 1. Derive actor server-side (no client-provided actorId)
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id || !(session.user as any).role) {
      throw new AppError("Unauthorized: Authentication required", 401);
    }
    const actorId = session.user.id;

    // 2. Validate input
    if (!paymentRecordId) {
      throw new AppError("Missing payment record ID", 400);
    }

    // 3. Fingerprint for idempotency (scope differentiates from record_payment)
    const fingerprint = paymentRecordId;

    // 4. Begin atomic transaction
    return await prisma.$transaction(async (tx) => {
      // 5. Claim IdempotencyKey (Lock Order Step 1)
      const existingKey = await tx.idempotencyKey.findUnique({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actorId,
            scope: "void_payment",
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
          throw new AppError("Concurrent void request in progress", 409);
        }
      }

      await tx.idempotencyKey.upsert({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actorId,
            scope: "void_payment",
            key: idempotencyKey
          }
        },
        create: {
          ownerType: "USER",
          ownerId: actorId,
          scope: "void_payment",
          key: idempotencyKey,
          fingerprint,
          status: "IN_PROGRESS"
        },
        update: {}
      });

      // 6. Load PaymentRecord to derive orderId (server-side, not from client)
      const paymentRecord = await tx.paymentRecord.findUnique({
        where: { id: paymentRecordId }
      });

      if (!paymentRecord) {
        throw new AppError("Payment record not found", 404);
      }

      const orderId = paymentRecord.orderId;
      const previousStatus = paymentRecord.status;

      // 7. Validate state machine eligibility
      const VOIDABLE_STATUSES = ["INITIATED", "COMPLETED"] as const;
      if (!VOIDABLE_STATUSES.includes(previousStatus as any)) {
        throw new AppError(
          `Cannot void payment in status: ${previousStatus}. Only INITIATED or COMPLETED payments can be voided.`,
          400
        );
      }

      // 8. Lock Order: SELECT FOR UPDATE (Lock Order Step 2)
      const order = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!order || order.length === 0) {
        throw new AppError("Order not found", 404);
      }
      const currentOrder = order[0];

      // 9. Update PaymentRecord status to VOIDED (Lock Order Step 3)
      const voidedRecord = await tx.paymentRecord.update({
        where: { id: paymentRecordId },
        data: { status: "VOIDED" }
      });

      // 10. Financial recalculation (only if COMPLETED → VOIDED)
      if (previousStatus === "COMPLETED") {
        // Authoritative recalculation: legacyAdvancePaid + SUM(COMPLETED payments)
        const allCompletedRecords = await tx.paymentRecord.findMany({
          where: {
            orderId,
            status: "COMPLETED"
          }
        });

        const newAdvancePaid = currentOrder.legacyAdvancePaid +
          allCompletedRecords.reduce((sum: number, record: any) => sum + record.amount, 0);
        const newBalanceDue = currentOrder.total - newAdvancePaid;

        // Safety: Verify no negative financial values
        if (newAdvancePaid < 0) {
          throw new AppError("Financial integrity violation: advancePaid would be negative", 500);
        }
        if (newBalanceDue < 0) {
          throw new AppError("Financial integrity violation: balanceDue would be negative", 500);
        }

        await tx.order.update({
          where: { id: orderId },
          data: {
            advancePaid: newAdvancePaid,
            balanceDue: newBalanceDue
          }
        });
      }
      // INITIATED → VOIDED: No financial changes needed (INITIATED was never in COMPLETED sum)

      // 11. Audit Event: PAYMENT_VOIDED
      const { appendOrderEvent } = await import("@/lib/persistence/orderEvent");
      await appendOrderEvent(
        tx,
        orderId,
        "PAYMENT_VOIDED",
        {
          paymentRecordId,
          amount: paymentRecord.amount,
          method: paymentRecord.method,
          reference: paymentRecord.reference,
          previousStatus,
          newStatus: "VOIDED"
        },
        { actorId, role: "ADMIN" }
      );

      // 12. Mark IdempotencyKey COMPLETED
      await tx.idempotencyKey.update({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actorId,
            scope: "void_payment",
            key: idempotencyKey
          }
        },
        data: {
          status: "COMPLETED",
          resultReference: paymentRecordId,
          responsePayload: voidedRecord as any
        }
      });

      return voidedRecord;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
    });
  }

  /**
   * Revises the required advance amount on an Order.
   *
   * requiredAdvance is a THRESHOLD / POLICY field — not an accounting balance.
   * Changing it has ZERO financial impact on advancePaid, balanceDue, or total.
   *
   * Eligibility:
   *   status ∈ {PENDING_ADVANCE, CONFIRMED} AND productionState === NOT_STARTED
   *
   * Lock Order: IdempotencyKey → Order (FOR UPDATE) → Order (update)
   */
  static async reviseAdvance(params: {
    orderId: string;
    newRequiredAdvance: number;
    reason: string;
    idempotencyKey: string;
  }) {
    const { orderId, newRequiredAdvance, reason, idempotencyKey } = params;

    // 1. Derive actor server-side (no client-provided actorId)
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id || !(session.user as any).role) {
      throw new AppError("Unauthorized: Authentication required", 401);
    }
    const actorId = session.user.id;

    // 2. Validate input (pre-transaction)
    if (!orderId) {
      throw new AppError("Missing order ID", 400);
    }
    if (typeof newRequiredAdvance !== "number" || !Number.isInteger(newRequiredAdvance)) {
      throw new AppError("Required advance must be an integer", 400);
    }
    if (newRequiredAdvance < 0) {
      throw new AppError("Required advance cannot be negative", 400);
    }
    if (!reason || !reason.trim()) {
      throw new AppError("Reason is required for advance revision", 400);
    }

    // 3. Fingerprint for idempotency
    const fingerprint = `${orderId}:${newRequiredAdvance}:${reason}`;

    // 4. Begin atomic transaction
    return await prisma.$transaction(async (tx) => {
      // 5. Claim IdempotencyKey (Lock Order Step 1)
      const existingKey = await tx.idempotencyKey.findUnique({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actorId,
            scope: "revise_advance",
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
          throw new AppError("Concurrent advance revision in progress", 409);
        }
      }

      await tx.idempotencyKey.upsert({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actorId,
            scope: "revise_advance",
            key: idempotencyKey
          }
        },
        create: {
          ownerType: "USER",
          ownerId: actorId,
          scope: "revise_advance",
          key: idempotencyKey,
          fingerprint,
          status: "IN_PROGRESS"
        },
        update: {}
      });

      // 6. Lock Order: SELECT FOR UPDATE (Lock Order Step 2)
      const order = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!order || order.length === 0) {
        throw new AppError("Order not found", 404);
      }
      const currentOrder = order[0];

      // 7. Validate against locked Order.total (server-derived, not client-provided)
      if (newRequiredAdvance > currentOrder.total) {
        throw new AppError(
          `Required advance (${newRequiredAdvance}) cannot exceed order total (${currentOrder.total})`,
          400
        );
      }

      // 8. Validate order eligibility
      const ELIGIBLE_STATUSES = ["PENDING_ADVANCE", "CONFIRMED"];
      if (!ELIGIBLE_STATUSES.includes(currentOrder.status)) {
        throw new AppError(
          `Cannot revise advance for order in status: ${currentOrder.status}. Only PENDING_ADVANCE or CONFIRMED orders are eligible.`,
          400
        );
      }
      if (currentOrder.productionState !== "NOT_STARTED") {
        throw new AppError(
          `Cannot revise advance after production has started (productionState: ${currentOrder.productionState})`,
          400
        );
      }

      // 9. Capture previous value for audit
      const previousAdvance = currentOrder.requiredAdvance;

      // 10. Update Order.requiredAdvance ONLY (Lock Order Step 3)
      // ZERO financial delta: advancePaid, balanceDue, total are NOT modified
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          requiredAdvance: newRequiredAdvance
        }
      });

      // 11. Audit Event: REQUIRED_ADVANCE_MODIFIED
      const { appendOrderEvent } = await import("@/lib/persistence/orderEvent");
      await appendOrderEvent(
        tx,
        orderId,
        "REQUIRED_ADVANCE_MODIFIED",
        {
          previousAdvance,
          newAdvance: newRequiredAdvance,
          reason: reason.trim()
        },
        { actorId, role: "ADMIN" }
      );

      // 12. Mark IdempotencyKey COMPLETED
      const responsePayload = {
        id: updatedOrder.id,
        requiredAdvance: updatedOrder.requiredAdvance,
        previousAdvance,
        reason: reason.trim()
      };

      await tx.idempotencyKey.update({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actorId,
            scope: "revise_advance",
            key: idempotencyKey
          }
        },
        data: {
          status: "COMPLETED",
          resultReference: orderId,
          responsePayload: responsePayload as any
        }
      });

      return responsePayload;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
    });
  }

  /**
   * Revises the unit price of items for an MTO order before production starts.
   */
  static async reviseOrderPrice(
    input: {
      orderId: string;
      items: { orderItemId: string; newUnitPrice: number }[];
      reason: string;
      idempotencyKey: string;
    },
    actor: { id: string; email: string; name?: string | null }
  ) {
    if (!input.orderId) throw new AppError("Missing order ID", 400);
    if (!input.items || input.items.length === 0) throw new AppError("Missing items to revise", 400);
    if (!input.reason?.trim()) throw new AppError("Missing reason", 400);

    // Sort items deterministically for fingerprint and locking
    const sortedInputItems = [...input.items].sort((a, b) => a.orderItemId.localeCompare(b.orderItemId));
    
    // Validate basics before transaction
    const itemIds = new Set<string>();
    for (const item of sortedInputItems) {
      if (item.newUnitPrice < 0) throw new AppError(`Negative price not allowed for item ${item.orderItemId}`, 400);
      if (itemIds.has(item.orderItemId)) throw new AppError(`Duplicate item ID in request: ${item.orderItemId}`, 400);
      itemIds.add(item.orderItemId);
    }

    const fingerprintPayload = {
      orderId: input.orderId,
      items: sortedInputItems.map(i => ({ id: i.orderItemId, price: i.newUnitPrice })),
      reason: input.reason.trim()
    };
    const fingerprint = JSON.stringify(fingerprintPayload);

    return await prisma.$transaction(async (tx) => {
      // 1. Claim IdempotencyKey
      const existingKey = await tx.idempotencyKey.findUnique({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actor.id,
            scope: "revise_price",
            key: input.idempotencyKey
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
          throw new AppError("Concurrent price revision request in progress", 409);
        }
      }

      await tx.idempotencyKey.upsert({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actor.id,
            scope: "revise_price",
            key: input.idempotencyKey
          }
        },
        create: {
          ownerType: "USER",
          ownerId: actor.id,
          scope: "revise_price",
          key: input.idempotencyKey,
          fingerprint,
          status: "IN_PROGRESS"
        },
        update: {}
      });

      // 2. Lock Order
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${input.orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) {
        throw new AppError("Order not found", 404);
      }
      
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        include: { items: true }
      });

      if (!order) throw new AppError("Order not found", 404);

      // 3. Eligibility Check
      if (!order.isMtoOrder) throw new AppError("Only MTO orders can be price-revised", 400);
      if (order.productionState !== "NOT_STARTED") throw new AppError("Production has already started", 400);
      if (order.status !== "PENDING_ADVANCE" && order.status !== "CONFIRMED") {
        throw new AppError(`Order status ${order.status} does not allow price revision`, 400);
      }
      if (order.advancePaid >= order.total) throw new AppError("Order is fully paid", 400);

      // 4. Lock Affected OrderItems deterministically
      const affectedItemIds = sortedInputItems.map(i => i.orderItemId);
      if (affectedItemIds.length > 0) {
        // Since we already sorted ascending by localeCompare, we can join safely
        // But for SQL IN it doesn't guarantee lock order. We must ORDER BY in the query.
        await tx.$queryRawUnsafe(`SELECT * FROM "OrderItem" WHERE id IN (${affectedItemIds.map(id => `'${id}'`).join(',')}) ORDER BY id ASC FOR UPDATE`);
      }

      // 5. Calculate per-item and validate
      let newSubtotal = 0;
      const revisionsToCreate = [];
      const changedItems = [];
      
      for (const orderItem of order.items) {
        const inputItem = sortedInputItems.find(i => i.orderItemId === orderItem.id);
        
        if (inputItem) {
          if (inputItem.newUnitPrice === orderItem.unitPrice) {
            throw new AppError(`Item ${orderItem.id} already has price ${orderItem.unitPrice}. Same-value revision not allowed.`, 400);
          }
          
          const newItemTotal = inputItem.newUnitPrice * orderItem.quantity;
          newSubtotal += newItemTotal;
          
          revisionsToCreate.push({
            orderId: order.id,
            orderItemId: orderItem.id,
            previousProductPrice: orderItem.unitPrice,
            adjustment: inputItem.newUnitPrice - orderItem.unitPrice,
            newProductPrice: inputItem.newUnitPrice,
            reason: input.reason.trim(),
            actor: actor as any
          });
          
          changedItems.push({
            id: orderItem.id,
            previousPrice: orderItem.unitPrice,
            newPrice: inputItem.newUnitPrice
          });

          // Mutate DB orderItem
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: {
              unitPrice: inputItem.newUnitPrice,
              total: newItemTotal
            }
          });
        } else {
          newSubtotal += orderItem.total;
        }
      }

      // 6. Check for foreign/missing items
      for (const inputItem of sortedInputItems) {
        const found = order.items.find(oi => oi.id === inputItem.orderItemId);
        if (!found) throw new AppError(`Item ${inputItem.orderItemId} does not belong to order ${order.id}`, 400);
      }

      // 7. Calculate new totals
      const newTotal = newSubtotal + order.shippingCost - order.discountAmount;
      const newBalanceDue = newTotal - order.advancePaid;

      // 8. Financial validations
      if (newTotal < order.advancePaid) {
        throw new AppError(`Revised total (${newTotal}) cannot be less than advance paid (${order.advancePaid})`, 400);
      }
      if (newTotal < order.requiredAdvance) {
        throw new AppError(`Revised total (${newTotal}) cannot be less than required advance (${order.requiredAdvance})`, 400);
      }
      if (newBalanceDue < 0) {
        throw new AppError(`Calculated balance due is negative`, 400);
      }

      // 9. Commit mutations
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          subtotal: newSubtotal,
          total: newTotal,
          balanceDue: newBalanceDue
        }
      });

      await tx.priceRevision.createMany({
        data: revisionsToCreate
      });

      // 10. Audit Event
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          sequence: await tx.orderEvent.count({ where: { orderId: order.id } }) + 1,
          eventType: "PRICE_REVISED",
          payload: {
            reason: input.reason.trim(),
            changedItems,
            previousTotal: order.total,
            newTotal: updatedOrder.total
          },
          actor: actor as any
        }
      });

      // 11. Complete Idempotency
      const responsePayload = {
        id: updatedOrder.id,
        subtotal: updatedOrder.subtotal,
        total: updatedOrder.total,
        balanceDue: updatedOrder.balanceDue
      };

      await tx.idempotencyKey.update({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actor.id,
            scope: "revise_price",
            key: input.idempotencyKey
          }
        },
        data: {
          status: "COMPLETED",
          resultReference: order.id,
          responsePayload: responsePayload as any
        }
      });

      return responsePayload;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5000,
      timeout: 15000
    });
  }
}
