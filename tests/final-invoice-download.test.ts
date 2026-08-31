import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "../src/app/api/documents/download/route";
import prisma from "../src/lib/prisma";
import { getServerSession } from "next-auth/next";
import { getStorageAdapter } from "../src/lib/infrastructure/storage";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("../src/lib/infrastructure/storage", () => ({
  getStorageAdapter: vi.fn(),
}));

describe("Final Invoice Download API", () => {
  const mockUserId = "user-123";
  const mockOtherUserId = "user-456";
  const mockOrderId = "order-123";
  const mockDocId = "doc-123";

  const mockGetSignedUrl = vi.fn();
  
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.mocked(getStorageAdapter).mockReturnValue({
      getSignedUrl: mockGetSignedUrl,
    } as any);

    // Setup basic DB objects
    await prisma.user.create({ data: { id: mockUserId, email: "test@example.com", name: "Test" } }).catch(() => {});
    await prisma.user.create({ data: { id: mockOtherUserId, email: "other@example.com", name: "Other" } }).catch(() => {});
    await prisma.order.create({
      data: {
        id: mockOrderId,
        userId: mockUserId,
        orderNumber: "ORD-TEST",
        status: "PROCESSING",
        total: 100,
        subtotal: 100,
        shippingCost: 0,
        discountAmount: 0,
        advancePaid: 0,
        legacyAdvancePaid: 0,
        requiredAdvance: 0,
        balanceDue: 100,
        shippingAddress: {},
        items: { create: [] },
      }
    }).catch(() => {});
  });

  afterEach(async () => {
    await prisma.orderDocument.deleteMany({ where: { orderId: mockOrderId } });
    await prisma.order.deleteMany({ where: { id: mockOrderId } });
    await prisma.user.deleteMany({ where: { id: { in: [mockUserId, mockOtherUserId] } } });
  });

  const makeRequest = (docId: string | null) => {
    const url = new URL("http://localhost/api/documents/download");
    if (docId) url.searchParams.set("documentId", docId);
    return new Request(url.toString());
  };

  it("1. Owner + valid Final Invoice -> 302", async () => {
    await prisma.orderDocument.create({
      data: {
        id: mockDocId,
        orderId: mockOrderId,
        documentType: "FINAL_INVOICE",
        referenceIdentity: "FINV-TEST-1",
        snapshot: {},
        templateVersion: "v1",
        createdBy: "system",
        storageKey: "test/key.pdf"
      }
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: mockUserId } } as any);
    mockGetSignedUrl.mockResolvedValueOnce("https://signed.url");

    const req = makeRequest(mockDocId);
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://signed.url/");
    expect(mockGetSignedUrl).toHaveBeenCalledWith("test/key.pdf"); // Default 300s is used implicitly inside adapter
  });

  it("2. Non-owner + valid Final Invoice -> 404 (IDOR)", async () => {
    await prisma.orderDocument.create({
      data: {
        id: mockDocId,
        orderId: mockOrderId,
        documentType: "FINAL_INVOICE",
        referenceIdentity: "FINV-TEST-2",
        snapshot: {},
        templateVersion: "v1",
        createdBy: "system",
        storageKey: "test/key.pdf"
      }
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: mockOtherUserId } } as any);
    const req = makeRequest(mockDocId);
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("3. Unauthenticated -> 401", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    const req = makeRequest(mockDocId);
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("4. Wrong document type -> 404", async () => {
    await prisma.orderDocument.create({
      data: {
        id: mockDocId,
        orderId: mockOrderId,
        documentType: "INVOICE",
        referenceIdentity: "INV-TEST-4",
        snapshot: {},
        templateVersion: "v1",
        createdBy: "system",
        storageKey: "test/key.pdf"
      }
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: mockUserId } } as any);
    const req = makeRequest(mockDocId);
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("5. storageKey null -> 404", async () => {
    await prisma.orderDocument.create({
      data: {
        id: mockDocId,
        orderId: mockOrderId,
        documentType: "FINAL_INVOICE",
        referenceIdentity: "FINV-TEST-5",
        snapshot: {},
        templateVersion: "v1",
        createdBy: "system",
        storageKey: null
      }
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: mockUserId } } as any);
    const req = makeRequest(mockDocId);
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("6. Missing document -> 404", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: mockUserId } } as any);
    const req = makeRequest("non-existent-id");
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("7. Storage/signing failure -> 500", async () => {
    await prisma.orderDocument.create({
      data: {
        id: mockDocId,
        orderId: mockOrderId,
        documentType: "FINAL_INVOICE",
        referenceIdentity: "FINV-TEST-7",
        snapshot: {},
        templateVersion: "v1",
        createdBy: "system",
        storageKey: "test/key.pdf"
      }
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: mockUserId } } as any);
    mockGetSignedUrl.mockRejectedValueOnce(new Error("Storage Error"));

    const req = makeRequest(mockDocId);
    const res = await GET(req);

    expect(res.status).toBe(500);
  });

  it("8. Download does not mutate DB", async () => {
    await prisma.orderDocument.create({
      data: {
        id: mockDocId,
        orderId: mockOrderId,
        documentType: "FINAL_INVOICE",
        referenceIdentity: "FINV-TEST-8",
        snapshot: {},
        templateVersion: "v1",
        createdBy: "system",
        storageKey: "test/key.pdf"
      }
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: mockUserId } } as any);
    mockGetSignedUrl.mockResolvedValueOnce("https://signed.url");

    // Before stats
    const beforeOrders = await prisma.order.count();
    const beforeDocs = await prisma.orderDocument.count();

    const req = makeRequest(mockDocId);
    await GET(req);

    // After stats
    const afterOrders = await prisma.order.count();
    const afterDocs = await prisma.orderDocument.count();

    expect(afterOrders).toBe(beforeOrders);
    expect(afterDocs).toBe(beforeDocs);
  });
});
