import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../src/app/api/admin/documents/regenerate/route";
import prisma from "../src/lib/prisma";
import { getServerSession } from "next-auth";
import { inngest } from "../src/inngest/client";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("../src/inngest/client", () => ({
  inngest: {
    send: vi.fn(),
  },
}));

vi.mock("../src/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
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
  },
}));

describe("POST /api/admin/documents/regenerate - Phase 1 Safety Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createJsonRequest = (body: any) => {
    return new Request("http://localhost/api/admin/documents/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  it("1. Rejects unauthenticated requests with 401", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    const req = createJsonRequest({ orderId: "ord-1" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("2. Rejects non-admin users with 401", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "user-1", role: "CUSTOMER" },
    } as any);
    const req = createJsonRequest({ orderId: "ord-1" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("3. Rejects missing identifiers with 400", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    } as any);
    const req = createJsonRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing identifier");
  });

  it("4. Rejects with 404 when order does not exist", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    } as any);
    vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);

    const req = createJsonRequest({ orderNumber: "NON-EXISTENT" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("5. Rejects with 404 when document does not exist for order", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    } as any);
    vi.mocked(prisma.order.findFirst).mockResolvedValueOnce({
      id: "ord-1",
      orderNumber: "RG-100",
    } as any);
    vi.mocked(prisma.orderDocument.findFirst).mockResolvedValueOnce(null);

    const req = createJsonRequest({ orderId: "ord-1" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("6. Never nullifies active storageKey; fails closed with 409", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    } as any);
    vi.mocked(prisma.order.findFirst).mockResolvedValueOnce({
      id: "ord-1",
      orderNumber: "RG-20261013-283096",
    } as any);
    vi.mocked(prisma.orderDocument.findFirst).mockResolvedValueOnce({
      id: "doc-1",
      orderId: "ord-1",
      documentType: "INVOICE",
      storageKey: "production/documents/invoice/ord-1/INV-1.pdf",
      snapshot: { orderTotal: 30040, requiredAdvance: 6008 },
      order: { orderNumber: "RG-20261013-283096" },
    } as any);

    const req = createJsonRequest({ orderNumber: "RG-20261013-283096" });
    const res = await POST(req);

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe("ACTIVE_STORAGE_POINTER_REPLACEMENT_REQUIRES_STAGING_JOB");

    // Critical invariant: DB must NEVER be updated to nullify storageKey
    expect(prisma.orderDocument.update).not.toHaveBeenCalled();
    expect(prisma.orderDocument.updateMany).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("7. Never reconstructs from mutable live order; fails closed with 422 if snapshot missing", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    } as any);
    vi.mocked(prisma.order.findFirst).mockResolvedValueOnce({
      id: "ord-1",
      orderNumber: "RG-20261013-283096",
    } as any);
    vi.mocked(prisma.orderDocument.findFirst).mockResolvedValueOnce({
      id: "doc-1",
      orderId: "ord-1",
      documentType: "INVOICE",
      storageKey: null,
      snapshot: null, // Corrupted or missing snapshot
      order: { orderNumber: "RG-20261013-283096" },
    } as any);

    const req = createJsonRequest({ orderId: "ord-1" });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe("SETTLEMENT_VERIFICATION_REQUIRED");

    // Must NOT mutate document or trigger regeneration
    expect(prisma.orderDocument.update).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("8. Safely triggers PDF generation when valid snapshot exists and storageKey is null", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    } as any);
    vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce({
      id: "doc-pending-1",
      orderId: "ord-1",
      documentType: "INVOICE",
      storageKey: null,
      snapshot: { orderTotal: 30040, requiredAdvance: 6008, invoiceType: "ADVANCE" },
      order: { orderNumber: "RG-20261013-283096" },
    } as any);

    const req = createJsonRequest({ documentId: "doc-pending-1" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.orderDocumentId).toBe("doc-pending-1");

    // Invariant: Snapshot was NOT altered, and storageKey was NOT touched
    expect(prisma.orderDocument.update).not.toHaveBeenCalled();
    expect(inngest.send).toHaveBeenCalledWith({
      name: "document/generation.requested",
      data: {
        orderDocumentId: "doc-pending-1",
        documentType: "INVOICE",
      },
    });
  });

  it("9. Rejects unsupported document types (e.g. PAYMENT_RECEIPT) with 400 when looked up by documentId", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    } as any);
    vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce({
      id: "doc-receipt-1",
      orderId: "ord-1",
      documentType: "PAYMENT_RECEIPT",
      storageKey: null,
      snapshot: { receiptNumber: "RCT-1" },
      order: { orderNumber: "RG-20261013-283096" },
    } as any);

    const req = createJsonRequest({ documentId: "doc-receipt-1" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("is not supported for regeneration");
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("10. Supports FINAL_INVOICE document type when looked up by documentId", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    } as any);
    vi.mocked(prisma.orderDocument.findUnique).mockResolvedValueOnce({
      id: "doc-final-1",
      orderId: "ord-1",
      documentType: "FINAL_INVOICE",
      storageKey: null,
      snapshot: {
        orderTotal: 30040,
        requiredAdvance: 6008,
        invoiceType: "FINAL",
        validPaidAtIssuance: 6008,
        balanceDueAtIssuance: 24032,
      },
      order: { orderNumber: "RG-20261013-283096" },
    } as any);

    const req = createJsonRequest({ documentId: "doc-final-1" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(inngest.send).toHaveBeenCalledWith({
      name: "document/generation.requested",
      data: {
        orderDocumentId: "doc-final-1",
        documentType: "FINAL_INVOICE",
      },
    });
  });
});
