import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import { getStorageAdapter } from "@/lib/infrastructure/storage";
import { CommunicationService, renderOrderConfirmation, renderPaymentReceipt, renderFinalInvoiceAvailable } from "@/services/communication.service";
import { getSiteConfig } from "@/data/site-config";
import { NotificationOutboxStatus } from "@prisma/client";

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

    // Step 1: Load and Claim Outbox
    const claimed = await step.run("load-and-claim-outbox", async () => {
      const updateResult = await prisma.notificationOutbox.updateMany({
        where: { 
          id: outboxId, 
          status: { in: [NotificationOutboxStatus.PENDING, NotificationOutboxStatus.FAILED] } 
        },
        data: { 
          status: NotificationOutboxStatus.PROCESSING, 
          updatedAt: new Date() 
        }
      });
      return updateResult.count > 0;
    });

    if (!claimed) {
      return { message: "Outbox already claimed or sent" };
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

      // Step 3: Fetch Private Blob if Document is Required
      if (documentType) {
        const docBuffer = await step.run("fetch-private-blob", async () => {
          const document = await prisma.orderDocument.findFirst({
            where: { orderId: order.id, documentType: documentType as any },
            orderBy: { createdAt: "desc" }
          });

          if (!document) {
            // For ORDER_CONFIRMATION, if there is no INVOICE, we might skip the invoice attachment 
            // or we throw DocumentNotReadyError if strict. The plan says "If storageKey is null... DocumentNotReadyError".
            // If the document record itself doesn't exist, we must wait for it to be created.
            throw new DocumentNotReadyError(`Required document ${documentType} not found for order ${order.id}`);
          }

          if (!document.storageKey) {
            throw new DocumentNotReadyError(`Document ${document.id} is not yet generated (storageKey is null)`);
          }

          const storage = getStorageAdapter();
          return await storage.download(document.storageKey);
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

      // Step 5: Dispatch to Resend
      const customerEmail = (order.shippingAddress as any)?.email;
      if (!customerEmail) {
        throw new Error("No customer email found in shipping address");
      }

      await step.run("dispatch-to-resend", async () => {
        const attachments = pdfBuffer && documentType ? [{
          filename: `${documentType}_${order.orderNumber}.pdf`,
          content: pdfBuffer
        }] : undefined;

        await CommunicationService.sendEmailWithAttachment({
          to: customerEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          attachments
        });
      });

      // Step 6: Mark Sent
      await step.run("mark-sent", async () => {
        await prisma.notificationOutbox.update({
          where: { id: outboxId },
          data: { 
            status: NotificationOutboxStatus.SENT, 
            processedAt: new Date(),
            updatedAt: new Date()
          }
        });
      });

      return { success: true };

    } catch (error: any) {
      if (error.name === "DocumentNotReadyError") {
        // Retryable error - revert to PENDING so it can be retried properly, or leave as PROCESSING
        // and throw so Inngest retries the step. Leaving it as PROCESSING means Inngest will retry the function.
        // Actually we should just throw, Inngest will retry.
        throw error;
      }

      // Mark as FAILED for non-retryable or unexpected errors that slip through the step retries
      // Wait, Inngest will retry the whole function if a step throws. 
      // To strictly mark as FAILED on final exhaustion, we would use an on-failure handler.
      // But we can also just throw the error to let Inngest handle retries.
      throw error;
    }
  }
);
