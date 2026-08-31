import "server-only";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors/AppError";
import { appendOrderEvent } from "@/lib/persistence/orderEvent";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { inngest } from "@/inngest/client";
import { getSiteConfig } from "@/data/site-config";

export class MtoAdminService {
  /**
   * Confirms an MTO order. Transitions status to CONFIRMED and sets a 48h deadline.
   */
  static async confirmMtoOrder(orderId: string, actorId: string) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the order
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // 2. Validate MTO
      if (!order.isMtoOrder) throw new AppError("Order is not an MTO order", 400);

      // Fetch related orderItems because raw query doesn't include relations
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: order.id }
      });
      order.items = orderItems;

      // 3. Idempotency Check
      if (order.status === "CONFIRMED") {
        const existingInvoice = await tx.orderDocument.findFirst({
          where: {
            orderId: orderId,
            documentType: "INVOICE",
            status: "ISSUED" // Might be voided, but let's assume we return the latest
          },
          orderBy: { createdAt: "desc" }
        });
        return { order, invoice: existingInvoice, isNewInvoice: false };
      }

      if (order.status !== "PENDING_ADVANCE") {
        throw new AppError(`Cannot confirm order in status: ${order.status}`, 400);
      }

      // 4. Create Invoice Document (Sequence logic serialized by FOR UPDATE lock)
      const invoiceCount = await tx.orderDocument.count({
        where: { orderId: orderId, documentType: "INVOICE" },
      });
      const sequence = invoiceCount + 1;
      const referenceIdentity = `INV-${order.orderNumber}-${sequence}`;

      const siteConfig = await getSiteConfig();
      
      const rawShipping = order.shippingAddress as any;
      const shippingAddressSnapshot = rawShipping ? {
        name: String(rawShipping.name || ""),
        address: String(rawShipping.address || ""),
        apartment: rawShipping.apartment ? String(rawShipping.apartment) : null,
        city: String(rawShipping.city || ""),
        postalCode: String(rawShipping.postalCode || ""),
        phone: String(rawShipping.phone || ""),
      } : null;

      const itemsSnapshot = Array.isArray(order.items) ? order.items.map((item: any) => ({
        productId: item.productId ? String(item.productId) : null,
        productName: String(item.productName || item.name || "Unknown"),
        customSpecification: item.customSpecification ? String(item.customSpecification) : null,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.price || 0),
        total: Number(item.total || (Number(item.quantity || 1) * Number(item.unitPrice || item.price || 0))),
      })) : [];

      const invoiceSnapshot = {
        invoiceType: "ADVANCE",
        orderTotal: order.total,
        requiredAdvance: order.requiredAdvance,
        shippingAddress: shippingAddressSnapshot,
        items: itemsSnapshot,
        customerEmail: order.customerEmail ? String(order.customerEmail) : "",
        issuedAt: new Date().toISOString(),
        branding: {
          companyName: siteConfig.name,
          address: siteConfig.address,
          email: siteConfig.support.email,
          phone: siteConfig.support.phone.display,
        }
      };

      const invoice = await tx.orderDocument.create({
        data: {
          orderId: order.id,
          documentType: "INVOICE",
          referenceIdentity: referenceIdentity,
          status: "ISSUED",
          snapshot: invoiceSnapshot,
          templateVersion: "1.0",
          createdBy: actorId,
        },
      });

      // 5. Set deadline (+48 hours)
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // 6. Update Order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          advanceDeadline: deadline,
        },
      });

      // 7. Audit & Notification
      const event = await appendOrderEvent(tx, orderId, "INVOICE_ISSUED", { invoiceId: invoice.id, referenceIdentity }, { actorId });

      await tx.notificationOutbox.create({
        data: {
          eventReference: event.id,
          orderId,
          notificationType: "INVOICE_AVAILABLE",
          channel: "EMAIL",
          status: "PENDING"
        }
      });

      return { order: updatedOrder, invoice, isNewInvoice: true };
    });

    if (result.isNewInvoice && result.invoice) {
      await inngest.send({
        name: "document/generation.requested",
        data: {
          orderDocumentId: result.invoice.id,
          documentType: "INVOICE"
        }
      });
    }

    return { order: result.order, invoice: result.invoice };
  }


  /**
   * Updates the required advance amount for an MTO order, safely serializing against payments.
   */
  static async updateRequiredAdvance(orderId: string, amount: number, actorId: string) {
    if (amount < 0) throw new AppError("Advance amount cannot be negative", 400);

    return prisma.$transaction(async (tx) => {
      // 1. Lock the order
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // 2. Validate
      if (!order.isMtoOrder) throw new AppError("Order is not an MTO order", 400);
      if (amount > order.total) throw new AppError("Required advance cannot exceed order total", 400);

      // 3. Verify zero payments (Payment Ledger is authoritative)
      const paymentCount = await tx.paymentRecord.count({
        where: { orderId: orderId, status: "COMPLETED" },
      });

      if (paymentCount > 0) {
        throw new AppError("Cannot modify required advance after a payment has been recorded.", 400);
      }

      // 4. Reset deadline (+48 hours from now)
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // 5. Update
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          requiredAdvance: amount,
          advanceDeadline: deadline,
        },
      });

      // 6. Audit
      await appendOrderEvent(tx, orderId, "REQUIRED_ADVANCE_MODIFIED", { previousAdvance: order.requiredAdvance, newAdvance: amount, advanceDeadline: deadline }, { actorId });

      return updatedOrder;
    });
  }

  /**
   * Corrects the shipping address for an order.
   */
  static async updateShippingAddress(orderId: string, newAddress: any, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new AppError("Order not found", 404);

      const previousAddress = order.shippingAddress;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { shippingAddress: newAddress },
      });

      await appendOrderEvent(tx, orderId, "SHIPPING_ADDRESS_CORRECTED", { previousAddress, newAddress }, { actorId });

      return updatedOrder;
    });
  }

  /**
   * Internal Notes CRUD
   */
  static async addInternalNote(orderId: string, content: string, createdBy: string) {
    if (!content.trim()) throw new AppError("Note content cannot be empty", 400);
    return prisma.adminInternalNote.create({
      data: { orderId, content, createdBy },
    });
  }

  static async updateInternalNote(noteId: string, content: string) {
    if (!content.trim()) throw new AppError("Note content cannot be empty", 400);
    return prisma.adminInternalNote.update({
      where: { id: noteId },
      data: { content },
    });
  }

  static async deleteInternalNote(noteId: string) {
    return prisma.adminInternalNote.delete({
      where: { id: noteId },
    });
  }

  /**
   * Marks a specific MTO order as expired (Manual Fallback).
   */
  static async markExpired(orderId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock the order
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // 2. Eligibility Validation
      if (!order.isMtoOrder) throw new AppError("Only MTO orders can expire via this mechanism", 400);
      if (order.status === "CANCELLED") throw new AppError("Order is already cancelled", 400);
      
      const eligibleStatuses = ["PENDING_ADVANCE", "CONFIRMED"];
      if (!eligibleStatuses.includes(order.status)) {
         throw new AppError(`Cannot expire order in status: ${order.status}`, 400);
      }

      if (!order.advanceDeadline) throw new AppError("Order has no advance deadline", 400);
      
      const now = new Date();
      if (new Date(order.advanceDeadline) >= now) {
        throw new AppError("Order deadline has not passed yet", 400);
      }

      // 3. Verify zero payments (Payment Ledger is authoritative)
      const paymentCount = await tx.paymentRecord.count({
        where: { orderId: orderId, status: "COMPLETED" },
      });

      if (paymentCount > 0) {
        throw new AppError("Order has recorded payments and cannot be automatically expired", 400);
      }

      // 4. Update
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      // 5. Audit
      await appendOrderEvent(tx, orderId, "MTO_EXPIRED", { reason: "Deadline passed with zero payments", manualTrigger: true }, { actorId });

      return updatedOrder;
    });
  }

  /**
   * Hourly Cron Execution for Expiry.
   */
  static async expireOverdueOrders() {
    const now = new Date();
    
    // Find all potential candidates first (to avoid locking too many rows at once)
    const candidates = await prisma.order.findMany({
      where: {
        isMtoOrder: true,
        status: { in: ["PENDING_ADVANCE", "CONFIRMED"] },
        advanceDeadline: { lt: now },
      },
      select: { id: true }
    });

    let expiredCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (const { id } of candidates) {
      try {
        await prisma.$transaction(async (tx) => {
          // Lock
          const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${id} FOR UPDATE`;
          if (!orders || orders.length === 0) return;
          const order = orders[0];

          // Re-verify after lock
          if (!order.isMtoOrder) return;
          if (order.status !== "PENDING_ADVANCE" && order.status !== "CONFIRMED") return;
          if (!order.advanceDeadline || new Date(order.advanceDeadline) >= now) return;

          // Zero payment check
          const paymentCount = await tx.paymentRecord.count({
            where: { orderId: id, status: "COMPLETED" },
          });

          if (paymentCount > 0) return; // Suppress expiry

          // Expire
          await tx.order.update({
            where: { id: id },
            data: { status: "CANCELLED" },
          });

          await appendOrderEvent(tx, id, "MTO_EXPIRED", { reason: "Deadline passed with zero payments", manualTrigger: false }, { actorId: "SYSTEM_CRON" });
          expiredCount++;
        });
      } catch (err) {
        logger.error({ err, orderId: id }, "Failed to process MTO expiry");
        failedCount++;
        errors.push({ orderId: id, error: (err as Error).message });
      }
    }

    return { processed: candidates.length, expiredCount, failedCount, errors };
  }

  /**
   * Starts production for an MTO order, validating payment sum against required advance.
   */
  static async startProduction(orderId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock the order
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // 2. Eligibility Validation
      if (!order.isMtoOrder) throw new AppError("Only MTO orders can start production via this mechanism", 400);
      
      // Reject invalid states explicitly per spec
      const invalidStatuses = ["PENDING_ADVANCE", "CANCELLED", "REJECTED", "PROCESSING", "DISPATCHED", "DELIVERED"];
      if (invalidStatuses.includes(order.status)) {
        throw new AppError(`Cannot start production in status: ${order.status}`, 400);
      }
      if (order.status !== "CONFIRMED") {
        throw new AppError(`Cannot start production in status: ${order.status}`, 400);
      }
      if (order.productionState !== "NOT_STARTED") {
        throw new AppError(`Cannot start production when production state is: ${order.productionState}`, 400);
      }

      // 3. Verify Payment Ledger sum
      const completedRecords = await tx.paymentRecord.findMany({
        where: { orderId: orderId, status: "COMPLETED" },
      });
      const authoritativePaid = order.legacyAdvancePaid + completedRecords.reduce((sum, r) => sum + r.amount, 0);

      if (authoritativePaid < order.requiredAdvance) {
        throw new AppError(`Cannot start production: Authoritative paid amount (${authoritativePaid}) is less than required advance (${order.requiredAdvance}).`, 400);
      }

      // 4. State Transitions
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PROCESSING",
          productionState: "IN_PROGRESS",
          trackingState: "IN_PRODUCTION",
        },
      });

      // 5. Audit & Notification
      const event = await appendOrderEvent(tx, orderId, "PRODUCTION_STARTED", { authoritativePaid, requiredAdvance: order.requiredAdvance }, { actorId });
      
      await tx.notificationOutbox.create({
        data: {
          eventReference: event.id,
          orderId,
          notificationType: "PRODUCTION_STARTED",
          channel: "EMAIL",
          status: "PENDING"
        }
      });

      return updatedOrder;
    });
  }

  /**
   * Completes production for an MTO order.
   */
  static async completeProduction(orderId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock the order
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // 2. Eligibility Validation
      if (!order.isMtoOrder) throw new AppError("Only MTO orders can complete production via this mechanism", 400);
      
      const invalidStatuses = ["PENDING_ADVANCE", "CONFIRMED", "CANCELLED", "REJECTED", "DISPATCHED", "DELIVERED"];
      if (invalidStatuses.includes(order.status)) {
         throw new AppError(`Cannot complete production in status: ${order.status}`, 400);
      }
      if (order.status !== "PROCESSING") {
        throw new AppError(`Cannot complete production in status: ${order.status}`, 400);
      }
      if (order.productionState !== "IN_PROGRESS") {
        throw new AppError(`Cannot complete production when production state is: ${order.productionState}`, 400);
      }

      // 3. State Transitions
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          productionState: "COMPLETE",
          trackingState: "QUALITY_CHECK",
          // Order.status remains PROCESSING per spec
        },
      });

      // 4. Audit
      await appendOrderEvent(tx, orderId, "PRODUCTION_COMPLETED", {}, { actorId });

      return updatedOrder;
    });
  }

  /**
   * Voids an unpaid MTO Advance Invoice.
   */
  static async voidInvoice(invoiceId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock the order via invoice
      const invoice = await tx.orderDocument.findUnique({
        where: { id: invoiceId }
      });
      if (!invoice) throw new AppError("Invoice not found", 404);

      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${invoice.orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // Refresh invoice after locking order to ensure consistency
      const currentInvoice = await tx.orderDocument.findUnique({
        where: { id: invoiceId }
      });
      if (!currentInvoice) throw new AppError("Invoice not found", 404);

      // 2. Validate
      if (currentInvoice.documentType !== "INVOICE") throw new AppError("Document is not an invoice", 400);
      if (currentInvoice.status !== "ISSUED") throw new AppError(`Cannot void invoice in status: ${currentInvoice.status}`, 400);
      
      const snapshot = currentInvoice.snapshot as any;
      if (snapshot?.invoiceType !== "ADVANCE") throw new AppError("Only ADVANCE invoices can be voided via this mechanism", 400);

      // 3. Verify zero payments linked to this invoice
      const completedRecords = await tx.paymentRecord.findMany({
        where: { invoiceDocumentId: invoiceId, status: "COMPLETED" },
      });
      const totalPaid = completedRecords.reduce((sum, r) => sum + r.amount, 0);

      if (totalPaid > 0) {
        throw new AppError("Cannot void an invoice that has completed payments", 400);
      }

      // 4. Update Invoice Status
      const updatedInvoice = await tx.orderDocument.update({
        where: { id: invoiceId },
        data: { status: "VOIDED" }
      });

      // 5. Audit
      const event = await appendOrderEvent(tx, order.id, "INVOICE_VOIDED", { invoiceId, referenceIdentity: currentInvoice.referenceIdentity }, { actorId });

      // 6. Notification (if standard convention dictates)
      await tx.notificationOutbox.create({
        data: {
          eventReference: event.id,
          orderId: order.id,
          notificationType: "INVOICE_VOIDED",
          channel: "EMAIL",
          status: "PENDING"
        }
      });

      return updatedInvoice;
    });
  }

  /**
   * Issues the Final Invoice for an MTO order after production is complete and delivery is finalized/delivered.
   */
  static async issueFinalInvoice(orderId: string, actorId: string) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the order
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // 2. Validate MTO
      if (!order.isMtoOrder) throw new AppError("Order is not an MTO order", 400);

      // Fetch related orderItems because raw query doesn't include relations
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: order.id }
      });
      order.items = orderItems;

      // 3. Lifecycle Validation
      if (order.productionState !== "COMPLETE") {
        throw new AppError(`Cannot issue Final Invoice: Production state is ${order.productionState}, expected COMPLETE.`, 400);
      }
      if (order.deliveryState !== "FINALIZED" && order.deliveryState !== "DELIVERED") {
        throw new AppError(`Cannot issue Final Invoice: Delivery state is ${order.deliveryState}, expected FINALIZED or DELIVERED.`, 400);
      }

      // 4. Idempotency Check
      const existingInvoice = await tx.orderDocument.findFirst({
        where: {
          orderId: orderId,
          documentType: "FINAL_INVOICE",
          status: "ISSUED" 
        },
        orderBy: { createdAt: "desc" }
      });
      if (existingInvoice) {
        return { order, invoice: existingInvoice, isNewInvoice: false };
      }

      // 5. Calculate Financial Snapshot (Payment Ledger is authoritative)
      const completedRecords = await tx.paymentRecord.findMany({
        where: { orderId: orderId, status: "COMPLETED" },
      });
      const validPaidAtIssuance = order.legacyAdvancePaid + completedRecords.reduce((sum, r) => sum + r.amount, 0);
      const balanceDueAtIssuance = Math.max(0, order.total - validPaidAtIssuance);

      // 6. Sequence Logic (Scoped to FINAL_INVOICE)
      const invoiceCount = await tx.orderDocument.count({
        where: { orderId: orderId, documentType: "FINAL_INVOICE" },
      });
      const sequence = invoiceCount + 1;
      const referenceIdentity = `FINV-${order.orderNumber}-${sequence}`;

      const siteConfig = await getSiteConfig();
      
      const rawShipping = order.shippingAddress as any;
      const shippingAddressSnapshot = rawShipping ? {
        name: String(rawShipping.name || ""),
        address: String(rawShipping.address || ""),
        apartment: rawShipping.apartment ? String(rawShipping.apartment) : null,
        city: String(rawShipping.city || ""),
        postalCode: String(rawShipping.postalCode || ""),
        phone: String(rawShipping.phone || ""),
      } : null;

      const itemsSnapshot = Array.isArray(order.items) ? order.items.map((item: any) => ({
        productId: item.productId ? String(item.productId) : null,
        productName: String(item.productName || item.name || "Unknown"),
        customSpecification: item.customSpecification ? String(item.customSpecification) : null,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.price || 0),
        total: Number(item.total || (Number(item.quantity || 1) * Number(item.unitPrice || item.price || 0))),
      })) : [];

      const invoiceSnapshot = {
        invoiceType: "FINAL",
        orderTotal: order.total,
        requiredAdvance: order.requiredAdvance,
        validPaidAtIssuance,
        balanceDueAtIssuance,
        shippingAddress: shippingAddressSnapshot,
        items: itemsSnapshot,
        customerEmail: order.customerEmail ? String(order.customerEmail) : "",
        issuedAt: new Date().toISOString(),
        branding: {
          companyName: siteConfig.name,
          address: siteConfig.address,
          email: siteConfig.support.email,
          phone: siteConfig.support.phone.display,
        }
      };

      // 7. Create Document
      const invoice = await tx.orderDocument.create({
        data: {
          orderId: order.id,
          documentType: "FINAL_INVOICE",
          referenceIdentity: referenceIdentity,
          status: "ISSUED",
          snapshot: invoiceSnapshot,
          templateVersion: "1.0",
          createdBy: actorId,
        },
      });

      // 8. Audit & Notification
      const event = await appendOrderEvent(tx, orderId, "FINAL_INVOICE_ISSUED", { 
        invoiceId: invoice.id, 
        referenceIdentity,
        finalOrderTotal: order.total,
        validPaidAtIssuance,
        balanceAtIssuance: balanceDueAtIssuance,
        finalProductPrice: order.subtotal,
        lockedDiscount: order.discountAmount,
        finalDeliveryCharge: order.shippingCost
      }, { actorId });

      await tx.notificationOutbox.create({
        data: {
          eventReference: event.id,
          orderId,
          notificationType: "FINAL_INVOICE_AVAILABLE",
          channel: "EMAIL",
          status: "PENDING"
        }
      });

      return { order, invoice, isNewInvoice: true };
    });

    if (result.isNewInvoice && result.invoice) {
      await inngest.send({
        name: "document/generation.requested",
        data: {
          orderDocumentId: result.invoice.id,
          documentType: "FINAL_INVOICE"
        }
      });
    }

    return { order: result.order, invoice: result.invoice, isNewInvoice: result.isNewInvoice };
  }

  static async dispatchOrder(
    orderId: string, 
    actorId: string, 
    trackingNumber?: string | null, 
    trackingUrl?: string | null, 
    notes?: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock the order
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      // 2. Idempotency Key
      const fingerprint = `dispatch_order_${orderId}`;
      const existingIdempotency = await tx.idempotencyKey.findUnique({
        where: {
          ownerType_ownerId_scope_key: {
            ownerType: "USER",
            ownerId: actorId,
            scope: "dispatch",
            key: fingerprint
          }
        }
      });
      if (existingIdempotency) {
        return order;
      }
      await tx.idempotencyKey.create({
        data: {
          ownerType: "USER",
          ownerId: actorId,
          scope: "dispatch",
          key: fingerprint,
          fingerprint: fingerprint,
        }
      });

      // 3. Validate valid starting states
      if (order.status === "CANCELLED" || order.status === "REJECTED") {
        throw new AppError(`Cannot dispatch a ${order.status} order.`, 400);
      }
      if (order.status === "DISPATCHED" || order.status === "DELIVERED") {
        throw new AppError(`Order is already ${order.status}.`, 400);
      }

      // 4. Validate Production State
      if (order.isMtoOrder && order.productionState !== "COMPLETE") {
        throw new AppError(`Cannot dispatch: Production state is ${order.productionState}, expected COMPLETE.`, 400);
      }

      // 5. Validate Final Invoice Gate
      const finalInvoice = await tx.orderDocument.findFirst({
        where: {
          orderId: orderId,
          documentType: "FINAL_INVOICE"
        }
      });
      if (!finalInvoice) {
        throw new AppError("Cannot dispatch: Final Invoice (FINAL_INVOICE) does not exist.", 400);
      }

      // 6. Validate Payment Gate
      if (order.balanceDue > 0) {
        throw new AppError(`Cannot dispatch: Balance due is ৳${order.balanceDue}, expected 0.`, 400);
      }

      // 7. Validate Tracking State
      if (order.trackingState !== "IN_PRODUCTION" && order.trackingState !== "PENDING_PRODUCTION") {
         throw new AppError(`Cannot dispatch: Tracking state is ${order.trackingState}, expected IN_PRODUCTION or PENDING_PRODUCTION.`, 400);
      }

      // 8. Update Order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "DISPATCHED",
          trackingState: "DISPATCHED",
          trackingNumber: trackingNumber || null,
          trackingUrl: trackingUrl || null,
        }
      });

      // 9. Create OrderEvent
      const event = await appendOrderEvent(tx, orderId, "ORDER_DISPATCHED", {
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        notes: notes || null
      }, actorId);

      // 10. Notification Outbox
      await tx.notificationOutbox.create({
        data: {
          orderId,
          eventReference: event.id,
          notificationType: "ORDER_DISPATCHED",
          channel: "EMAIL",
          status: "PENDING"
        }
      });

      return updatedOrder;
    });
  }
}

