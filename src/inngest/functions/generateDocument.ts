import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/pdfGenerator";
import { getStorageAdapter } from "@/lib/infrastructure/storage";
import crypto from "crypto";

export const generateDocument = inngest.createFunction(
  { id: "generate-document", retries: 3, triggers: [{ event: "document/generation.requested" }] },
  async ({ event, step }) => {
    const { orderDocumentId, documentType } = event.data;

    // Step 1: Load Document
    const document = await step.run("load-document", async () => {
      const doc = await prisma.orderDocument.findUnique({
        where: { id: orderDocumentId },
        include: { order: { select: { orderNumber: true } } }
      });
      if (!doc) throw new Error("Document not found");
      return doc;
    });

    // Step 2: Verify eligibility
    if (document.storageKey) {
      return { message: "Document already generated", storageKey: document.storageKey };
    }

    // Step 3: Render PDF (Return as base64 to allow serialization by Inngest)
    const pdfBase64 = await step.run("render-pdf", async () => {
      let buffer: Buffer;
      if (documentType === "INVOICE") {
        buffer = await generateInvoicePDF(document.snapshot as any, document.templateVersion);
      } else if (documentType === "FINAL_INVOICE") {
        buffer = await generateInvoicePDF(document.snapshot as any, document.templateVersion);
      } else if (documentType === "PAYMENT_RECEIPT") {
        buffer = await generateReceiptPDF(document.snapshot as any, document.templateVersion);
      } else {
        throw new Error(`Unsupported document type: ${documentType}`);
      }
      return buffer.toString("base64");
    });

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Step 4: Calculate SHA-256 Checksum
    const checksum = await step.run("calculate-checksum", async () => {
      const hash = crypto.createHash("sha256");
      hash.update(pdfBuffer);
      return hash.digest("hex");
    });

    // Step 5: Upload to Vercel Blob Private Store
    // Format: {env}/documents/{documentType}/{orderId}/{referenceIdentity}.pdf
    const envNamespace = process.env.NODE_ENV === "production" ? "production" : "development";
    const deterministicKey = `${envNamespace}/documents/${documentType.toLowerCase()}/${document.orderId}/${document.referenceIdentity}.pdf`;

    const blobUrl = await step.run("upload-blob", async () => {
      const storage = getStorageAdapter();
      // Enforce access: "private" according to ADR 0149
      return await storage.upload(pdfBuffer, deterministicKey, {
        access: "private",
        contentType: "application/pdf"
      });
    });

    // Step 6: Conditional DB Update
    await step.run("update-db", async () => {
      const updateResult = await prisma.orderDocument.updateMany({
        where: {
          id: orderDocumentId,
          storageKey: null // Conditional update ensures strict idempotency
        },
        data: {
          storageKey: deterministicKey,
          checksum: checksum,
          size: pdfBuffer.length,
          mimeType: "application/pdf"
        }
      });
      
      if (updateResult.count === 0) {
        // Document was already updated concurrently or manual intervention occurred
        console.warn(`Idempotent skip: OrderDocument ${orderDocumentId} already has a storageKey`);
      }
    });

    return { success: true, url: blobUrl };
  }
);
