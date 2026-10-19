import prisma from "@/lib/prisma";
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/pdfGenerator";
import { getStorageAdapter } from "@/lib/infrastructure/storage";
import { appendOrderEvent } from "@/lib/persistence/orderEvent";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export interface StageCandidateParams {
  orderDocumentId?: string;
  orderNumber?: string;
  orderId?: string;
  adminId: string;
}

export interface CandidateDescriptor {
  success: boolean;
  orderDocumentId: string;
  orderNumber?: string;
  documentType: string;
  referenceIdentity: string;
  currentActiveStorageKey: string | null;
  currentActiveChecksum: string | null;
  candidateStorageKey: string;
  candidateSignedUrl?: string;
  candidateChecksum: string;
  candidateSize: number;
  stagedAt: string;
}

export interface PromoteCandidateParams {
  orderDocumentId: string;
  expectedCurrentStorageKey: string;
  expectedPriorChecksum?: string | null;
  candidateStorageKey: string;
  candidateChecksum: string;
  candidateSize: number;
  adminId: string;
}

export interface PromotionResult {
  success: boolean;
  alreadyPromoted?: boolean;
  orderDocumentId: string;
  promotedStorageKey: string;
  previousStorageKey: string;
  promotedChecksum: string;
  promotedSize: number;
  promotedAt: string;
}

export class DocumentStagingService {
  /**
   * Validates snapshot financial consistency against authoritative order record.
   */
  private static validateSnapshotFinancialInvariants(doc: any) {
    if (!doc.snapshot || typeof doc.snapshot !== "object" || Object.keys(doc.snapshot).length === 0) {
      throw new Error("SETTLEMENT_VERIFICATION_REQUIRED: Historical snapshot missing or empty");
    }

    const s = doc.snapshot as Record<string, any>;
    if (!s.orderNumber || typeof s.orderNumber !== "string") {
      throw new Error("FINANCIAL_VALIDATION_FAILED: Snapshot missing valid orderNumber");
    }

    if (!Array.isArray(s.items) || s.items.length === 0) {
      throw new Error("FINANCIAL_VALIDATION_FAILED: Snapshot items array is missing or empty");
    }

    if (doc.order) {
      if (s.orderNumber !== doc.order.orderNumber) {
        throw new Error(
          `FINANCIAL_VALIDATION_FAILED: Snapshot orderNumber (${s.orderNumber}) does not match order record (${doc.order.orderNumber})`
        );
      }
      if (typeof s.subtotal === "number" && s.subtotal !== doc.order.subtotal) {
        throw new Error(
          `FINANCIAL_VALIDATION_FAILED: Snapshot subtotal (${s.subtotal}) does not match order subtotal (${doc.order.subtotal})`
        );
      }
      if (typeof s.orderTotal === "number" && s.orderTotal !== doc.order.total) {
        throw new Error(
          `FINANCIAL_VALIDATION_FAILED: Snapshot orderTotal (${s.orderTotal}) does not match order total (${doc.order.total})`
        );
      }
    }
  }

  /**
   * Resolves a document and generates a staged candidate artifact in Vercel Blob store
   * without mutating the active production document record or active storage pointer.
   */
  static async stageCandidateDocument(params: StageCandidateParams): Promise<CandidateDescriptor> {
    const { orderDocumentId, orderNumber, orderId, adminId } = params;

    if (!orderDocumentId && !orderNumber && !orderId) {
      throw new Error("Missing document identifier: orderDocumentId, orderNumber, or orderId required");
    }

    let doc: any = null;
    if (orderDocumentId) {
      doc = await prisma.orderDocument.findUnique({
        where: { id: orderDocumentId },
        include: { order: true },
      });
    } else {
      const order = await prisma.order.findFirst({
        where: orderId ? { id: orderId } : { orderNumber: orderNumber! },
      });
      if (!order) {
        throw new Error(`Order not found for identifier: ${orderId || orderNumber}`);
      }
      doc = await prisma.orderDocument.findFirst({
        where: {
          orderId: order.id,
          documentType: "INVOICE",
        },
        orderBy: { createdAt: "desc" },
        include: { order: true },
      });
    }

    if (!doc) {
      throw new Error("Target OrderDocument not found");
    }

    // Invariant: Snapshot validation and financial consistency check
    this.validateSnapshotFinancialInvariants(doc);

    // Render candidate PDF using current deployed PDF generator
    let pdfBuffer: Buffer;
    if (doc.documentType === "INVOICE" || doc.documentType === "FINAL_INVOICE") {
      pdfBuffer = await generateInvoicePDF(doc.snapshot as any, doc.templateVersion || "1.0");
    } else if (doc.documentType === "PAYMENT_RECEIPT") {
      pdfBuffer = await generateReceiptPDF(doc.snapshot as any, doc.templateVersion || "1.0");
    } else {
      throw new Error(`Unsupported document type for staging: ${doc.documentType}`);
    }

    // Compute cryptographic SHA-256 checksum
    const checksum = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

    // Staging namespace isolation: strictly isolated under /staged/
    const envNamespace = process.env.NODE_ENV === "production" ? "production" : "development";
    const candidateStorageKey = `${envNamespace}/documents/${doc.documentType.toLowerCase()}/staged/${doc.orderId}/${doc.referenceIdentity}_${checksum.slice(0, 8)}.pdf`;

    // Upload candidate to private blob store
    const storage = getStorageAdapter();
    await storage.upload(pdfBuffer, candidateStorageKey, {
      access: "private",
      contentType: "application/pdf",
    });

    const candidateSignedUrl = await storage.getSignedUrl(candidateStorageKey, 600);

    logger.info(
      {
        adminId,
        orderDocumentId: doc.id,
        referenceIdentity: doc.referenceIdentity,
        candidateStorageKey,
        checksum,
      },
      "Document candidate successfully staged under isolated candidate key"
    );

    return {
      success: true,
      orderDocumentId: doc.id,
      orderNumber: doc.order?.orderNumber,
      documentType: doc.documentType,
      referenceIdentity: doc.referenceIdentity,
      currentActiveStorageKey: doc.storageKey,
      currentActiveChecksum: doc.checksum,
      candidateStorageKey,
      candidateSignedUrl,
      candidateChecksum: checksum,
      candidateSize: pdfBuffer.length,
      stagedAt: new Date().toISOString(),
    };
  }

  /**
   * Promotes a verified candidate to become the active storage pointer.
   * Performs exhaustive server-side authenticity, checksum, identity, and concurrency verification.
   * Preserves historical blob without deletion.
   * Employs interactive transaction with appendOrderEvent for durable audit evidence.
   */
  static async promoteCandidateDocument(params: PromoteCandidateParams): Promise<PromotionResult> {
    const {
      orderDocumentId,
      expectedCurrentStorageKey,
      expectedPriorChecksum,
      candidateStorageKey,
      candidateChecksum,
      candidateSize,
      adminId,
    } = params;

    if (
      !orderDocumentId ||
      !expectedCurrentStorageKey ||
      !candidateStorageKey ||
      !candidateChecksum ||
      typeof candidateSize !== "number"
    ) {
      throw new Error("Missing required promotion parameter(s)");
    }

    // 1. Candidate Key Format & Namespace Isolation
    if (!candidateStorageKey.includes("/staged/") || !candidateStorageKey.endsWith(".pdf")) {
      throw new Error("INVALID_CANDIDATE_NAMESPACE: candidateStorageKey must reside within the /staged/ namespace and end with .pdf");
    }

    // 2. Fetch Document with Order Record
    const doc = await prisma.orderDocument.findUnique({
      where: { id: orderDocumentId },
      include: { order: true },
    });

    if (!doc) {
      throw new Error("OrderDocument not found for promotion");
    }

    // 3. Idempotency Check (Duplicate Request Handling)
    if (doc.storageKey === candidateStorageKey && doc.checksum === candidateChecksum) {
      logger.info(
        { orderDocumentId, candidateStorageKey },
        "Promotion request is idempotent: candidate is already the active pointer"
      );
      return {
        success: true,
        alreadyPromoted: true,
        orderDocumentId: doc.id,
        promotedStorageKey: doc.storageKey,
        previousStorageKey: doc.storageKey,
        promotedChecksum: doc.checksum!,
        promotedSize: doc.size || candidateSize,
        promotedAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      };
    }

    // 4. Concurrency Guard: Active Pointer Check
    if (doc.storageKey !== expectedCurrentStorageKey) {
      logger.error(
        {
          orderDocumentId,
          actualStorageKey: doc.storageKey,
          expectedCurrentStorageKey,
        },
        "Promotion aborted: active storageKey mismatch detected"
      );
      throw new Error("CONCURRENT_MODIFICATION_DETECTED: Active storage pointer does not match expected current pointer");
    }

    // 5. Prior Checksum Verification (if specified)
    if (expectedPriorChecksum !== undefined && expectedPriorChecksum !== null && doc.checksum && doc.checksum !== expectedPriorChecksum) {
      logger.error(
        { orderDocumentId, actualChecksum: doc.checksum, expectedPriorChecksum },
        "Promotion aborted: prior checksum mismatch detected"
      );
      throw new Error("CONCURRENT_MODIFICATION_DETECTED: Active document prior checksum mismatch");
    }

    // 6. Identity Binding Verification
    // candidateStorageKey must strictly match the target document's type, orderId, and referenceIdentity
    const envNamespace = process.env.NODE_ENV === "production" ? "production" : "development";
    const expectedKeyPrefix = `${envNamespace}/documents/${doc.documentType.toLowerCase()}/staged/${doc.orderId}/${doc.referenceIdentity}_`;
    if (!candidateStorageKey.startsWith(expectedKeyPrefix)) {
      logger.error(
        { candidateStorageKey, expectedKeyPrefix, orderDocumentId },
        "Promotion aborted: candidateStorageKey does not bind to target order, document type, and reference identity"
      );
      throw new Error("IDENTITY_BINDING_MISMATCH: candidateStorageKey does not bind to target document identity");
    }

    // 7. Snapshot & Financial Invariant Verification
    this.validateSnapshotFinancialInvariants(doc);

    // 8. Independent Server-Side Candidate Blob Verification in Storage
    const storage = getStorageAdapter();
    const blobExists = await storage.exists(candidateStorageKey);
    if (!blobExists) {
      logger.error({ candidateStorageKey }, "Promotion aborted: candidate blob does not exist in storage");
      throw new Error("CANDIDATE_BLOB_NOT_FOUND: Candidate blob not found in storage");
    }

    const candidateBuffer = await storage.download(candidateStorageKey);
    if (!candidateBuffer || candidateBuffer.length === 0) {
      throw new Error("CANDIDATE_BLOB_EMPTY: Staged candidate blob is empty");
    }

    // Compute actual SHA-256 and byte length independently on the server
    const actualChecksum = crypto.createHash("sha256").update(candidateBuffer).digest("hex");
    const actualSize = candidateBuffer.length;

    if (actualChecksum !== candidateChecksum) {
      logger.error(
        { submittedChecksum: candidateChecksum, actualChecksum },
        "Promotion aborted: actual candidate blob SHA-256 does not match submitted checksum"
      );
      throw new Error("CHECKSUM_MISMATCH: Actual blob SHA-256 does not match submitted candidateChecksum");
    }

    if (actualSize !== candidateSize) {
      logger.error(
        { submittedSize: candidateSize, actualSize },
        "Promotion aborted: actual candidate blob byte length does not match submitted candidateSize"
      );
      throw new Error("SIZE_MISMATCH: Actual blob byte length does not match submitted candidateSize");
    }

    if (!candidateStorageKey.endsWith(`_${actualChecksum.slice(0, 8)}.pdf`)) {
      throw new Error("IDENTITY_BINDING_MISMATCH: candidateStorageKey hash suffix does not match actual blob hash");
    }

    // 9. Atomic Conditional Update & Durable Audit Log in Interactive Transaction
    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.orderDocument.updateMany({
        where: {
          id: orderDocumentId,
          storageKey: expectedCurrentStorageKey, // Strict concurrency lock
        },
        data: {
          storageKey: candidateStorageKey,
          checksum: actualChecksum,
          size: actualSize,
        },
      });

      if (updateResult.count !== 1) {
        logger.error(
          { orderDocumentId, expectedCurrentStorageKey },
          "Promotion failed: Atomic swap condition matched 0 rows"
        );
        throw new Error("CONCURRENT_MODIFICATION_DETECTED: Atomic conditional swap failed");
      }

      // Append durable audit event to the order aggregate
      await appendOrderEvent(
        tx,
        doc.orderId,
        "DOCUMENT_PROMOTED",
        {
          orderDocumentId: doc.id,
          documentType: doc.documentType,
          referenceIdentity: doc.referenceIdentity,
          previousStorageKey: expectedCurrentStorageKey,
          previousChecksum: doc.checksum,
          promotedStorageKey: candidateStorageKey,
          promotedChecksum: actualChecksum,
          promotedSize: actualSize,
        },
        { actorId: adminId, role: "ADMIN" }
      );
    });

    // Invariant: Historical blob is preserved (expectedCurrentStorageKey is NOT deleted)
    logger.info(
      {
        adminId,
        orderDocumentId,
        previousStorageKey: expectedCurrentStorageKey,
        promotedStorageKey: candidateStorageKey,
        checksum: actualChecksum,
      },
      "OrderDocument candidate atomically promoted to active storage pointer with durable audit event"
    );

    return {
      success: true,
      orderDocumentId,
      promotedStorageKey: candidateStorageKey,
      previousStorageKey: expectedCurrentStorageKey,
      promotedChecksum: actualChecksum,
      promotedSize: actualSize,
      promotedAt: new Date().toISOString(),
    };
  }
}
