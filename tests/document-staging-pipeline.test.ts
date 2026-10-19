import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as stagePOST } from "../src/app/api/admin/documents/stage/route";
import { POST as promotePOST } from "../src/app/api/admin/documents/promote/route";
import prisma from "../src/lib/prisma";
import { getServerSession } from "next-auth";
import { getStorageAdapter } from "../src/lib/infrastructure/storage";
import { appendOrderEvent } from "../src/lib/persistence/orderEvent";
import crypto from "crypto";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("../src/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockStorage = {
  upload: vi.fn().mockResolvedValue("production/documents/invoice/staged/order-991567/INV-RG-20261018-991567-1_abc12345.pdf"),
  download: vi.fn(),
  exists: vi.fn(),
  getSignedUrl: vi.fn().mockResolvedValue("https://blob.vercel-storage.com/signed-url"),
  delete: vi.fn(),
};

vi.mock("../src/lib/infrastructure/storage", () => ({
  getStorageAdapter: vi.fn(() => mockStorage),
}));

vi.mock("../src/lib/persistence/orderEvent", () => ({
  appendOrderEvent: vi.fn().mockResolvedValue({ id: "evt-promoted-123", sequence: 5 }),
}));

vi.mock("../src/lib/prisma", () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    orderDocument: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      orderDocument: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      orderEvent: {
        create: vi.fn().mockResolvedValue({ id: "evt-1" }),
        aggregate: vi.fn().mockResolvedValue({ _max: { sequence: 4 } }),
      },
    })),
  },
}));

describe("Document Candidate Staging and Promotion Pipeline - Security & Correctness Gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (url: string, body: any, headers: Record<string, string> = {}) => {
    return new Request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "rootgrain.bd",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  const mockAdminSession = {
    user: { id: "admin-bilash", role: "ADMIN" },
  };

  const sampleSnapshot = {
    orderNumber: "RG-20261018-991567",
    referenceIdentity: "INV-RG-20261018-991567-1",
    invoiceType: "ADVANCE",
    orderTotal: 30040,
    subtotal: 29990,
    shippingCost: 50,
    requiredAdvance: 6008,
    customerEmail: "bilash@example.bd",
    shippingAddress: {
      name: "মো: বিলাশ হোসেন",
      address: "১২৩ বীর উত্তম সি.আর. দত্ত রোড, হাতিরপুল",
      city: "ঢাকা",
      postalCode: "১২০৫",
      phone: "০১৭১২৩৪৫৬৭৮",
    },
    items: [
      {
        productName: "রুটভানা স্কাল্পটেড সেন্টার টেবিল - সলিড সেগুন কাঠ",
        quantity: 1,
        unitPrice: 29990,
        total: 29990,
      },
    ],
    branding: {
      companyName: "রুটগ্রেন ফার্নিচার",
      email: "billing@rootgrain.bd",
      phone: "+880 1700-000000",
      address: { line1: "House 12, Road 4, Sector 3, Uttara", line2: "Dhaka-1230" },
    },
  };

  const mockTargetOrder = {
    id: "order-991567",
    orderNumber: "RG-20261018-991567",
    subtotal: 29990,
    shippingCost: 50,
    total: 30040,
    advancePaid: 0,
    balanceDue: 30040,
  };

  describe("Authentication, Authorization & CSRF Protection", () => {
    it("1. Stage: Rejects unauthenticated caller with 401 UNAUTHORIZED", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const req = createRequest("http://localhost/api/admin/documents/stage", { orderNumber: "RG-20261018-991567" });
      const res = await stagePOST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("UNAUTHORIZED");
    });

    it("2. Stage: Rejects non-admin caller with 403 FORBIDDEN", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-attacker", role: "CUSTOMER" },
      } as any);
      const req = createRequest("http://localhost/api/admin/documents/stage", { orderNumber: "RG-20261018-991567" });
      const res = await stagePOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("FORBIDDEN");
    });

    it("3. Promote: Rejects unauthenticated caller with 401 UNAUTHORIZED", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const req = createRequest("http://localhost/api/admin/documents/promote", { orderDocumentId: "doc-1" });
      const res = await promotePOST(req);
      expect(res.status).toBe(401);
    });

    it("4. Promote: Rejects non-admin caller with 403 FORBIDDEN", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-attacker", role: "USER" },
      } as any);
      const req = createRequest("http://localhost/api/admin/documents/promote", { orderDocumentId: "doc-1" });
      const res = await promotePOST(req);
      expect(res.status).toBe(403);
    });

    it("5. CSRF Protection: Rejects cross-origin POST request with 403 FORBIDDEN", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      const req = createRequest("http://localhost/api/admin/documents/promote", {
        orderDocumentId: "doc-1",
      }, {
        origin: "https://malicious-site.com",
        host: "rootgrain.bd",
      });
      const res = await promotePOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("FORBIDDEN");
    });
  });

  describe("Candidate Staging & Snapshot Financial Validation", () => {
    it("6. Stage: Rejects request with missing snapshot or empty snapshot with 422", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce({
        id: "doc-corrupted",
        orderId: "order-991567",
        documentType: "INVOICE",
        snapshot: null,
        order: mockTargetOrder,
      } as any);

      const req = createRequest("http://localhost/api/admin/documents/stage", { orderDocumentId: "doc-corrupted" });
      const res = await stagePOST(req);
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.error).toBe("FINANCIAL_VALIDATION_FAILED");
    });

    it("7. Stage: Rejects snapshot with financial subtotal mismatch against order record with 422", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      const tamperedSnapshot = { ...sampleSnapshot, subtotal: 999999 }; // Tampered amount
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce({
        id: "doc-tampered-subtotal",
        orderId: "order-991567",
        documentType: "INVOICE",
        snapshot: tamperedSnapshot,
        order: mockTargetOrder,
      } as any);

      const req = createRequest("http://localhost/api/admin/documents/stage", { orderDocumentId: "doc-tampered-subtotal" });
      const res = await stagePOST(req);
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.message).toContain("Snapshot subtotal (999999) does not match order subtotal (29990)");
    });

    it("8. Stage: Successfully stages candidate under isolated staged/ key and does NOT mutate database pointers", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      const mockDoc = {
        id: "doc-target-991567",
        orderId: "order-991567",
        documentType: "INVOICE",
        referenceIdentity: "INV-RG-20261018-991567-1",
        templateVersion: "1.0",
        storageKey: "production/documents/invoice/order-991567/INV-RG-20261018-991567-1.pdf",
        checksum: "old-historical-checksum-sha256",
        snapshot: sampleSnapshot,
        order: mockTargetOrder,
      };
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce(mockDoc as any);

      const req = createRequest("http://localhost/api/admin/documents/stage", {
        orderDocumentId: "doc-target-991567",
      });
      const res = await stagePOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.orderDocumentId).toBe("doc-target-991567");
      expect(data.candidateStorageKey).toContain("/staged/order-991567/INV-RG-20261018-991567-1_");
      expect(data.candidateStorageKey).toMatch(/\.pdf$/);
      expect(data.currentActiveStorageKey).toBe(mockDoc.storageKey);
      expect(data.candidateChecksum).toBeTruthy();
      expect(data.candidateSize).toBeGreaterThan(1000);

      // Invariant: active DB pointer is NOT modified during staging
      expect(prisma.orderDocument.update).not.toHaveBeenCalled();
      expect(prisma.orderDocument.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("Server-Side Candidate Authenticity & Identity Verification", () => {
    const validCandidateBuffer = Buffer.from("%PDF-1.4 Mock Candidate Buffer Content For Test Verification");
    const validCandidateChecksum = crypto.createHash("sha256").update(validCandidateBuffer).digest("hex");
    const validCandidateSize = validCandidateBuffer.length;
    const envNamespace = process.env.NODE_ENV === "production" ? "production" : "development";
    const validCandidateStorageKey = `${envNamespace}/documents/invoice/staged/order-991567/INV-RG-20261018-991567-1_${validCandidateChecksum.slice(0, 8)}.pdf`;

    const validPromotionPayload = {
      orderDocumentId: "doc-target-991567",
      expectedCurrentStorageKey: "production/documents/invoice/order-991567/INV-RG-20261018-991567-1.pdf",
      candidateStorageKey: validCandidateStorageKey,
      candidateChecksum: validCandidateChecksum,
      candidateSize: validCandidateSize,
    };

    const mockTargetDoc = {
      id: "doc-target-991567",
      orderId: "order-991567",
      documentType: "INVOICE",
      referenceIdentity: "INV-RG-20261018-991567-1",
      storageKey: "production/documents/invoice/order-991567/INV-RG-20261018-991567-1.pdf",
      checksum: "old-checksum-sha256",
      snapshot: sampleSnapshot,
      order: mockTargetOrder,
    };

    it("9. Promote: Rejects candidate keys outside staged/ namespace with 400", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      const req = createRequest("http://localhost/api/admin/documents/promote", {
        ...validPromotionPayload,
        candidateStorageKey: "production/documents/invoice/direct-overwrite.pdf",
      });
      const res = await promotePOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("INVALID_CANDIDATE_NAMESPACE");
    });

    it("10. Promote: Rejects candidate belonging to a different order or document identity with 403", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce(mockTargetDoc as any);

      const crossOrderPayload = {
        ...validPromotionPayload,
        // Belongs to order-DIFFERENT
        candidateStorageKey: `${envNamespace}/documents/invoice/staged/order-ATTACKER/INV-RG-20261018-991567-1_${validCandidateChecksum.slice(0, 8)}.pdf`,
      };

      const req = createRequest("http://localhost/api/admin/documents/promote", crossOrderPayload);
      const res = await promotePOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("IDENTITY_BINDING_MISMATCH");
    });

    it("11. Promote: Rejects candidate if blob does not exist in storage with 404", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce(mockTargetDoc as any);
      mockStorage.exists.mockResolvedValueOnce(false); // Blob missing in storage

      const req = createRequest("http://localhost/api/admin/documents/promote", validPromotionPayload);
      const res = await promotePOST(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("NOT_FOUND");
    });

    it("12. Promote: Rejects promotion if actual blob SHA-256 does not match submitted checksum (Tampered Blob) with 422", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce(mockTargetDoc as any);
      mockStorage.exists.mockResolvedValueOnce(true);
      // Actual blob content has different checksum
      mockStorage.download.mockResolvedValueOnce(Buffer.from("%PDF-1.4 Tampered Malicious Content"));

      const req = createRequest("http://localhost/api/admin/documents/promote", validPromotionPayload);
      const res = await promotePOST(req);
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.message).toContain("CHECKSUM_MISMATCH");
    });

    it("13. Promote: Rejects promotion if actual blob byte size does not match submitted candidateSize with 422", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce(mockTargetDoc as any);
      mockStorage.exists.mockResolvedValueOnce(true);
      mockStorage.download.mockResolvedValueOnce(validCandidateBuffer);

      const tamperedSizePayload = {
        ...validPromotionPayload,
        candidateSize: 999999, // Mismatched size
      };

      const req = createRequest("http://localhost/api/admin/documents/promote", tamperedSizePayload);
      const res = await promotePOST(req);
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.message).toContain("SIZE_MISMATCH");
    });
  });

  describe("Atomic Promotion Preconditions, Concurrency & Durable Audit", () => {
    const validCandidateBuffer = Buffer.from("%PDF-1.4 Valid Candidate Buffer");
    const validCandidateChecksum = crypto.createHash("sha256").update(validCandidateBuffer).digest("hex");
    const validCandidateSize = validCandidateBuffer.length;
    const envNamespace = process.env.NODE_ENV === "production" ? "production" : "development";
    const validCandidateStorageKey = `${envNamespace}/documents/invoice/staged/order-991567/INV-RG-20261018-991567-1_${validCandidateChecksum.slice(0, 8)}.pdf`;

    const validPromotionPayload = {
      orderDocumentId: "doc-target-991567",
      expectedCurrentStorageKey: "production/documents/invoice/order-991567/INV-RG-20261018-991567-1.pdf",
      candidateStorageKey: validCandidateStorageKey,
      candidateChecksum: validCandidateChecksum,
      candidateSize: validCandidateSize,
    };

    const mockTargetDoc = {
      id: "doc-target-991567",
      orderId: "order-991567",
      documentType: "INVOICE",
      referenceIdentity: "INV-RG-20261018-991567-1",
      storageKey: "production/documents/invoice/order-991567/INV-RG-20261018-991567-1.pdf",
      checksum: "old-checksum-sha256",
      snapshot: sampleSnapshot,
      order: mockTargetOrder,
    };

    it("14. Promote: Rejects promotion with 409 if active storage pointer has changed (Stale Pointer Guard)", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce({
        ...mockTargetDoc,
        storageKey: "production/documents/invoice/order-991567/CHANGED_BY_CONCURRENT_TRANSACTION.pdf",
      } as any);

      const req = createRequest("http://localhost/api/admin/documents/promote", validPromotionPayload);
      const res = await promotePOST(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("CONCURRENT_MODIFICATION_DETECTED");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("15. Promote: Rejects promotion with 409 if expectedPriorChecksum does not match active document checksum", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce(mockTargetDoc as any);

      const payloadWithWrongPriorChecksum = {
        ...validPromotionPayload,
        expectedPriorChecksum: "mismatched-prior-checksum",
      };

      const req = createRequest("http://localhost/api/admin/documents/promote", payloadWithWrongPriorChecksum);
      const res = await promotePOST(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("CONCURRENT_MODIFICATION_DETECTED");
      expect(data.message).toContain("prior checksum mismatch");
    });

    it("16. Promote: Idempotency - duplicate request with already-promoted candidate returns 200 without error", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      // Document is ALREADY active with this candidate key and checksum
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce({
        ...mockTargetDoc,
        storageKey: validCandidateStorageKey,
        checksum: validCandidateChecksum,
        size: validCandidateSize,
      } as any);

      const req = createRequest("http://localhost/api/admin/documents/promote", {
        ...validPromotionPayload,
        expectedCurrentStorageKey: validCandidateStorageKey,
      });
      const res = await promotePOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.alreadyPromoted).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("17. Promote: Successfully promotes candidate atomically, records OrderEvent, and PRESERVES historical blob", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce(mockTargetDoc as any);
      mockStorage.exists.mockResolvedValueOnce(true);
      mockStorage.download.mockResolvedValueOnce(validCandidateBuffer);

      let capturedTxUpdateMany: any = null;
      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          orderDocument: {
            updateMany: vi.fn().mockImplementation((args) => {
              capturedTxUpdateMany = args;
              return { count: 1 };
            }),
          },
          orderEvent: {
            create: vi.fn().mockResolvedValue({ id: "evt-promoted" }),
            aggregate: vi.fn().mockResolvedValue({ _max: { sequence: 4 } }),
          },
        });
      });

      const req = createRequest("http://localhost/api/admin/documents/promote", validPromotionPayload);
      const res = await promotePOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.promotedStorageKey).toBe(validCandidateStorageKey);
      expect(data.previousStorageKey).toBe(validPromotionPayload.expectedCurrentStorageKey);
      expect(data.promotedChecksum).toBe(validCandidateChecksum);

      // Verify conditional updateMany in transaction
      expect(capturedTxUpdateMany).toEqual({
        where: {
          id: validPromotionPayload.orderDocumentId,
          storageKey: validPromotionPayload.expectedCurrentStorageKey,
        },
        data: {
          storageKey: validCandidateStorageKey,
          checksum: validCandidateChecksum,
          size: validCandidateSize,
        },
      });

      // Verify durable audit event was appended
      expect(appendOrderEvent).toHaveBeenCalledWith(
        expect.anything(),
        mockTargetDoc.orderId,
        "DOCUMENT_PROMOTED",
        expect.objectContaining({
          orderDocumentId: mockTargetDoc.id,
          documentType: mockTargetDoc.documentType,
          previousStorageKey: validPromotionPayload.expectedCurrentStorageKey,
          promotedStorageKey: validCandidateStorageKey,
          promotedChecksum: validCandidateChecksum,
        }),
        { actorId: "admin-bilash", role: "ADMIN" }
      );

      // CRITICAL PRESERVATION INVARIANT: Historical blob MUST NOT be deleted
      expect(mockStorage.delete).not.toHaveBeenCalled();
    });

    it("18. Promote: Concurrency race condition - updateMany count 0 triggers 409 conflict and preserves state", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce(mockTargetDoc as any);
      mockStorage.exists.mockResolvedValueOnce(true);
      mockStorage.download.mockResolvedValueOnce(validCandidateBuffer);

      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          orderDocument: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }), // Zero rows updated (concurrent modification)
          },
        });
      });

      const req = createRequest("http://localhost/api/admin/documents/promote", validPromotionPayload);
      const res = await promotePOST(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("CONCURRENT_MODIFICATION_DETECTED");

      // Verify historical blob was NOT deleted on failure
      expect(mockStorage.delete).not.toHaveBeenCalled();
    });
  });
});
