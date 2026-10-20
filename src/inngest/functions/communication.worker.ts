import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import { getStorageAdapter } from "@/lib/infrastructure/storage";
import { CommunicationService, renderOrderConfirmation, renderPaymentReceipt, renderFinalInvoiceAvailable } from "@/services/communication.service";
import { getSiteConfig } from "@/data/site-config";
import { NotificationOutboxStatus } from "@prisma/client";
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/pdfGenerator";

export class DocumentNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentNotReadyError";
  }
}

export const communicationWorker = inngest.createFunction(
  { 
    id: "communication-worker", 
    retries: 3, 
    triggers: [{ event: "communication/email.requested" }] 
  },
  async ({ event, step }) => {
    const { outboxId } = event.data;

    // Step 1: Load and Claim Outbox with Lease / Stale Recovery Concurrency Control
    const claimed = await step.run("load-and-claim-outbox", async () => {
      const STALE_LEASE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
      const staleThreshold = new Date(Date.now() - STALE_LEASE_THRESHOLD_MS);

      const updateResult = await prisma.notificationOutbox.updateMany({
        where: { 
          id: outboxId, 
          OR: [
            { status: { in: [NotificationOutboxStatus.PENDING, NotificationOutboxStatus.FAILED] } },
            { status: NotificationOutboxStatus.PROCESSING, updatedAt: { lt: staleThreshold } }
          ]
        },
        data: { 
          status: NotificationOutboxStatus.PROCESSING, 
          attempts: { increment: 1 },
          updatedAt: new Date() 
        }
      });
      return updateResult.count > 0;
    });

    if (!claimed) {
      return { message: "Outbox already claimed, processing, or sent", skipped: true };
    }

    try {
      // Step 2: Hydrate Data
      const { outbox, order, orderEvent } = await step.run("hydrate-data", async () => {
        const outbox = await prisma.notificationOutbox.findUnique({
          where: { id: outboxId },
          include: {
            order: {
              include: { items: true }
            },
            event: true
          }
        });
        if (!outbox) throw new Error("Outbox not found");
        return { outbox, order: outbox.order, orderEvent: outbox.event };
      });

      const config = await getSiteConfig();
      let pdfBuffer: Buffer | undefined = undefined;
      let documentType: string | undefined = undefined;

      // Determine required document
      if (outbox.notificationType === "ORDER_CONFIRMATION") {
        documentType = "INVOICE";
      } else if (outbox.notificationType === "PAYMENT_RECEIPT") {
        documentType = "PAYMENT_RECEIPT";
      } else if (outbox.notificationType === "FINAL_INVOICE_AVAILABLE") {
        documentType = "FINAL_INVOICE";
      }

      // Step 3: Fetch Private Blob or Generate from Authoritative Snapshot
      if (documentType) {
        const docBuffer = await step.run("fetch-private-blob", async () => {
          const document = await prisma.orderDocument.findFirst({
            where: { orderId: order.id, documentType: documentType as any },
            orderBy: { createdAt: "desc" }
          });

          if (!document) {
            throw new Error(`Required document ${documentType} not found for order ${order.id}`);
          }

          // If canonical storageKey exists, download from storage adapter
          if (document.storageKey) {
            try {
              const storage = getStorageAdapter();
              return await storage.download(document.storageKey);
            } catch (err: any) {
              console.warn(`Storage download failed for ${document.storageKey}, falling back to snapshot render:`, err?.message);
            }
          }

          // Authoritative in-memory generation fallback from the immutable snapshot
          // Ensures identical PDF bytes/layout and eliminates race condition if document upload is pending
          if (document.snapshot) {
            if (documentType === "INVOICE" || documentType === "FINAL_INVOICE") {
              return await generateInvoicePDF(document.snapshot as any, document.templateVersion);
            } else if (documentType === "PAYMENT_RECEIPT") {
              return await generateReceiptPDF(document.snapshot as any, document.templateVersion);
            }
          }

          throw new Error(`Document ${document.id} has neither storageKey nor valid snapshot to generate PDF`);
        });

        if (docBuffer) {
           // We have to parse the buffer because Inngest step output serializes it as { type: 'Buffer', data: [...] }
           const data = (docBuffer as any).data || docBuffer;
           pdfBuffer = Buffer.from(data);
        }
      }

      // Step 4: Render Email Template
      const emailContent = await step.run("render-email-template", async () => {
        if (outbox.notificationType === "ORDER_CONFIRMATION") {
          return await renderOrderConfirmation(order, config);
        } else if (outbox.notificationType === "PAYMENT_RECEIPT") {
          const amount = (orderEvent.payload as any)?.amount || 0;
          return await renderPaymentReceipt(order, amount, config);
        } else if (outbox.notificationType === "FINAL_INVOICE_AVAILABLE") {
          return await renderFinalInvoiceAvailable(order, config);
        }
        throw new Error(`Unsupported notification type: ${outbox.notificationType}`);
      });

      // Step 5: Validate recipient & Dispatch to Resend
      const customerEmail = (order.shippingAddress as any)?.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!customerEmail || typeof customerEmail !== 'string' || !emailRegex.test(customerEmail.trim())) {
        await prisma.notificationOutbox.update({
          where: { id: outboxId },
          data: {
            status: NotificationOutboxStatus.FAILED,
            lastError: "PERMANENT_VALIDATION_ERROR: Missing or invalid customer email address in shipping address",
            updatedAt: new Date()
          }
        });
        return { success: false, error: "Permanent validation error: invalid customer email address", nonRetryable: true };
      }

      await step.run("dispatch-to-resend", async () => {
        const filename = documentType === "INVOICE" 
          ? `Invoice_${order.orderNumber}.pdf` 
          : `${documentType}_${order.orderNumber}.pdf`;

        const attachments = pdfBuffer && documentType ? [{
          filename,
          content: pdfBuffer
        }] : undefined;

        await CommunicationService.sendEmailWithAttachment({
          to: customerEmail.trim(),
          subject: emailContent.subject,
          html: emailContent.html,
          attachments,
          outboxId: outbox.id
        });
      });

      // Step 6: Mark Sent
      await step.run("mark-sent", async () => {
        await prisma.notificationOutbox.update({
          where: { id: outboxId },
          data: { 
            status: NotificationOutboxStatus.SENT, 
            processedAt: new Date(),
            updatedAt: new Date(),
            lastError: null
          }
        });
      });

      return { success: true };

    } catch (error: any) {
      // Record failure on outbox with safe error logging (no secrets or customer PII)
      try {
        await prisma.notificationOutbox.update({
          where: { id: outboxId },
          data: {
            status: NotificationOutboxStatus.FAILED,
            lastError: (error?.message || String(error)).slice(0, 500),
            updatedAt: new Date()
          }
        });
      } catch (dbErr) {
        // Ignore DB update error during error propagation
      }
      throw error;
    }
  }
);
