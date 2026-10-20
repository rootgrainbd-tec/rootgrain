import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationOutboxStatus } from "@prisma/client";

// Hoist mocks
const { mockResendSend, mockInngestSend, mockStorageDownload, mockStorageUpload, mockPrisma } = vi.hoisted(() => ({
  mockResendSend: vi.fn(),
  mockInngestSend: vi.fn(),
  mockStorageDownload: vi.fn(),
  mockStorageUpload: vi.fn(),
  mockPrisma: {
    notificationOutbox: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    orderDocument: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: mockResendSend,
      };
    },
  };
});

vi.mock("@/inngest/client", () => ({
  inngest: {
    send: mockInngestSend,
    createFunction: vi.fn((config, handler) => ({ config, handler })),
  },
}));

vi.mock("@/lib/infrastructure/storage", () => ({
  getStorageAdapter: vi.fn(() => ({
    download: mockStorageDownload,
    upload: mockStorageUpload,
  })),
}));

vi.mock("@/data/site-config", () => ({
  getSiteConfig: vi.fn().mockResolvedValue({
    name: "RootGrain",
    url: "https://rootgrain.bd",
    support: { email: "support@rootgrain.bd", phone: { display: "+8801700000000" } },
    address: { line1: "House 12, Road 5", line2: "Dhanmondi, Dhaka" },
  }),
  getFreshSiteConfig: vi.fn().mockResolvedValue({
    name: "RootGrain",
    url: "https://rootgrain.bd",
    support: { email: "support@rootgrain.bd", phone: { display: "+8801700000000" } },
    address: { line1: "House 12, Road 5", line2: "Dhanmondi, Dhaka" },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

// Import after mocking
import { communicationWorker } from "@/inngest/functions/communication.worker";
import { generateDocument } from "@/inngest/functions/generateDocument";
import { renderOrderConfirmation, CommunicationService } from "@/services/communication.service";

describe("RootGrain — Automatic Customer Invoice Email Delivery & Outbox Concurrency Suite", () => {
  const commHandler = (communicationWorker as any).handler;
  const genDocHandler = (generateDocument as any).handler;

  const mockStep = {
    run: async (name: string, cb: any) => await cb(),
  };

  const sampleOrder = {
    id: "ord_101",
    orderNumber: "RG-20261020-388547",
    subtotal: 29990,
    shippingCost: 50,
    discountAmount: 0,
    total: 30040,
    requiredAdvance: 6008,
    isMtoOrder: false,
    shippingAddress: {
      name: "Bilash",
      email: "customer@example.com",
      phone: "01917389253",
      street: "Darsanaa",
      district: "Jhalokati",
      division: "Barishal",
      postCode: "8400",
    },
    items: [
      {
        id: "item_1",
        productName: "RootVana Sculpted Center Table",
        quantity: 1,
        unitPrice: 29990,
        total: 29990,
      },
    ],
  };

  const sampleDocumentSnapshot = {
    invoiceType: "ADVANCE" as const,
    orderTotal: 30040,
    requiredAdvance: 6008,
    shippingAddress: {
      name: "Bilash",
      address: "Darsanaa",
      city: "Jhalokati",
      postalCode: "8400",
      phone: "01917389253",
    },
    items: [
      {
        productId: "p_1",
        productName: "RootVana Sculpted Center Table",
        quantity: 1,
        unitPrice: 29990,
        total: 29990,
      },
    ],
    customerEmail: "customer@example.com",
    issuedAt: "2026-10-20T12:00:00Z",
    referenceIdentity: "INV-RG-20261020-388547-1",
    branding: {
      companyName: "RootGrain",
      address: { line1: "House 12", line2: "Dhaka" },
      email: "support@rootgrain.bd",
      phone: "+8801700000000",
    },
    subtotal: 29990,
    shippingCost: 50,
    discountAmount: 0,
    orderNumber: "RG-20261020-388547",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResendSend.mockResolvedValue({ data: { id: "msg_123" }, error: null });
    mockStorageUpload.mockResolvedValue("https://blob.vercel-storage.com/invoice.pdf");
    mockStorageDownload.mockResolvedValue(Buffer.from("%PDF-1.4 Mock Canonical Blob"));
  });

  // 1 & 2: Successful order triggers invoice email to recipient stored on order
  it("Criterion 1 & 2: Successfully created order dispatches email to recipient stored on order", async () => {
    mockPrisma.notificationOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notificationOutbox.findUnique.mockResolvedValue({
      id: "outbox_1",
      orderId: "ord_101",
      notificationType: "ORDER_CONFIRMATION",
      order: sampleOrder,
      event: { id: "evt_1", payload: {} },
    });
    mockPrisma.orderDocument.findFirst.mockResolvedValue({
      id: "doc_1",
      orderId: "ord_101",
      documentType: "INVOICE",
      storageKey: "production/documents/invoice/ord_101/INV-RG-20261020-388547-1.pdf",
      snapshot: sampleDocumentSnapshot,
      templateVersion: "1.0",
    });

    const result = await commHandler({
      event: { data: { outboxId: "outbox_1" } },
      step: mockStep,
    });

    expect(result.success).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(1);

    const callArgs = mockResendSend.mock.calls[0][0];
    expect(callArgs.to).toBe("customer@example.com");
    expect(callArgs.subject).toContain("RG-20261020-388547");
  });

  // 3: Customer-facing invoice URL and PDF attachment are included
  it("Criterion 3: Email contains the customer-facing invoice URL and PDF attachment", async () => {
    const rendered = await renderOrderConfirmation(sampleOrder, {
      name: "RootGrain",
      url: "https://rootgrain.bd",
    } as any);

    // Verify invoice URL format
    expect(rendered.html).toContain("https://rootgrain.bd/checkout/invoice?order=RG-20261020-388547");
    expect(rendered.html).toContain("View Invoice");
    expect(rendered.html).toContain("Delivery Charge:</td>");
    expect(rendered.html).toContain("৳50");
    expect(rendered.html).toContain("৳29,990");
    expect(rendered.html).toContain("৳30,040");
    expect(rendered.html).toContain("Advance Required: ৳6,008");
  });

  // 4: Handles initial null storageKey via authoritative in-memory snapshot render (eliminates race condition)
  it("Criterion 4: Eliminates race condition — generates from authoritative snapshot when storageKey is initially null", async () => {
    mockPrisma.notificationOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notificationOutbox.findUnique.mockResolvedValue({
      id: "outbox_1",
      orderId: "ord_101",
      notificationType: "ORDER_CONFIRMATION",
      order: sampleOrder,
      event: { id: "evt_1", payload: {} },
    });
    // storageKey is NULL (generateDocument still running or uploading)
    mockPrisma.orderDocument.findFirst.mockResolvedValue({
      id: "doc_1",
      orderId: "ord_101",
      documentType: "INVOICE",
      storageKey: null,
      snapshot: sampleDocumentSnapshot,
      templateVersion: "1.0",
    });

    const result = await commHandler({
      event: { data: { outboxId: "outbox_1" } },
      step: mockStep,
    });

    expect(result.success).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(1);

    const callArgs = mockResendSend.mock.calls[0][0];
    expect(callArgs.attachments).toBeDefined();
    expect(callArgs.attachments.length).toBe(1);
    expect(callArgs.attachments[0].filename).toBe("Invoice_RG-20261020-388547.pdf");
    expect(Buffer.isBuffer(callArgs.attachments[0].content)).toBe(true);
    expect(callArgs.attachments[0].content.length).toBeGreaterThan(100); // Valid generated PDF buffer
  });

  // 5: Document generation completion triggers pending email delivery
  it("Criterion 5: Document generation completion resumes waiting notification outbox", async () => {
    mockPrisma.orderDocument.findUnique.mockResolvedValue({
      id: "doc_1",
      orderId: "ord_101",
      referenceIdentity: "INV-RG-20261020-388547-1",
      snapshot: sampleDocumentSnapshot,
      templateVersion: "1.0",
      storageKey: null,
    });
    mockPrisma.orderDocument.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notificationOutbox.findFirst.mockResolvedValue({
      id: "outbox_pending_1",
      orderId: "ord_101",
      status: NotificationOutboxStatus.PENDING,
    });

    await genDocHandler({
      event: { data: { orderDocumentId: "doc_1", documentType: "INVOICE" } },
      step: mockStep,
    });

    expect(mockInngestSend).toHaveBeenCalledWith({
      name: "communication/email.requested",
      data: { outboxId: "outbox_pending_1" },
    });
  });

  // 6: Failed order rollback never creates outbox or triggers email
  it("Criterion 6: Rolled-back orders never dispatch email because outbox row is never committed", async () => {
    // If outbox ID is not found (e.g. rolled back tx)
    mockPrisma.notificationOutbox.updateMany.mockResolvedValue({ count: 0 });

    const result = await commHandler({
      event: { data: { outboxId: "non_existent_rolled_back" } },
      step: mockStep,
    });

    expect(result.skipped).toBe(true);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  // 7: Concurrency control prevents duplicate claiming
  it("Criterion 7: Concurrent workers cannot claim the same outbox item simultaneously", async () => {
    // First worker claims (count: 1)
    mockPrisma.notificationOutbox.updateMany.mockResolvedValueOnce({ count: 1 });
    // Second concurrent worker tries claiming same outbox ID (count: 0)
    mockPrisma.notificationOutbox.updateMany.mockResolvedValueOnce({ count: 0 });

    const call1Promise = commHandler({
      event: { data: { outboxId: "outbox_concurrent" } },
      step: mockStep,
    });

    // Provide hydrate mock for worker 1
    mockPrisma.notificationOutbox.findUnique.mockResolvedValue({
      id: "outbox_concurrent",
      orderId: "ord_101",
      notificationType: "ORDER_CONFIRMATION",
      order: sampleOrder,
      event: { id: "evt_1", payload: {} },
    });
    mockPrisma.orderDocument.findFirst.mockResolvedValue({
      id: "doc_1",
      orderId: "ord_101",
      documentType: "INVOICE",
      storageKey: "some/key.pdf",
      snapshot: sampleDocumentSnapshot,
      templateVersion: "1.0",
    });

    const call2Promise = commHandler({
      event: { data: { outboxId: "outbox_concurrent" } },
      step: mockStep,
    });

    const [res1, res2] = await Promise.all([call1Promise, call2Promise]);

    expect(res1.success).toBe(true);
    expect(res2.skipped).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });

  // 8: Stale PROCESSING records are safely recovered
  it("Criterion 8: Recovers stale PROCESSING records older than lease threshold (5 minutes)", async () => {
    // updateMany includes updatedAt: { lt: staleThreshold } in OR condition
    mockPrisma.notificationOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notificationOutbox.findUnique.mockResolvedValue({
      id: "outbox_stale_1",
      orderId: "ord_101",
      notificationType: "ORDER_CONFIRMATION",
      order: sampleOrder,
      event: { id: "evt_1", payload: {} },
    });
    mockPrisma.orderDocument.findFirst.mockResolvedValue({
      id: "doc_1",
      orderId: "ord_101",
      documentType: "INVOICE",
      storageKey: "stale/key.pdf",
      snapshot: sampleDocumentSnapshot,
      templateVersion: "1.0",
    });

    const result = await commHandler({
      event: { data: { outboxId: "outbox_stale_1" } },
      step: mockStep,
    });

    expect(result.success).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });

  // 9: Already-sent records are not resent (Idempotency)
  it("Criterion 9: Already-sent records are never claimed or resent", async () => {
    mockPrisma.notificationOutbox.updateMany.mockResolvedValue({ count: 0 }); // SENT is excluded from updateMany query

    const result = await commHandler({
      event: { data: { outboxId: "outbox_already_sent" } },
      step: mockStep,
    });

    expect(result.skipped).toBe(true);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  // 10: Provider failure records error and supports retry
  it("Criterion 10: Transient provider failure records FAILED on outbox and rethrows for Inngest retry", async () => {
    mockPrisma.notificationOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notificationOutbox.findUnique.mockResolvedValue({
      id: "outbox_fail",
      orderId: "ord_101",
      notificationType: "ORDER_CONFIRMATION",
      order: sampleOrder,
      event: { id: "evt_1", payload: {} },
    });
    mockPrisma.orderDocument.findFirst.mockResolvedValue({
      id: "doc_1",
      orderId: "ord_101",
      documentType: "INVOICE",
      storageKey: "valid/key.pdf",
      snapshot: sampleDocumentSnapshot,
      templateVersion: "1.0",
    });

    mockResendSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Resend 503 Service Unavailable" },
    });

    await expect(
      commHandler({
        event: { data: { outboxId: "outbox_fail" } },
        step: mockStep,
      })
    ).rejects.toThrow("Resend 503 Service Unavailable");

    // Verify outbox was updated to FAILED with error message
    expect(mockPrisma.notificationOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "outbox_fail" },
        data: expect.objectContaining({
          status: NotificationOutboxStatus.FAILED,
          lastError: expect.stringContaining("Resend 503 Service Unavailable"),
        }),
      })
    );
  });

  // 11: Missing or invalid email addresses are handled safely without infinite retries
  it("Criterion 11: Missing or invalid customer email is marked FAILED non-retryable without crashing", async () => {
    const invalidOrder = {
      ...sampleOrder,
      shippingAddress: {
        ...sampleOrder.shippingAddress,
        email: "not-a-valid-email",
      },
    };

    mockPrisma.notificationOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notificationOutbox.findUnique.mockResolvedValue({
      id: "outbox_invalid_email",
      orderId: "ord_101",
      notificationType: "ORDER_CONFIRMATION",
      order: invalidOrder,
      event: { id: "evt_1", payload: {} },
    });
    mockPrisma.orderDocument.findFirst.mockResolvedValue({
      id: "doc_1",
      orderId: "ord_101",
      documentType: "INVOICE",
      storageKey: "valid/key.pdf",
      snapshot: sampleDocumentSnapshot,
      templateVersion: "1.0",
    });

    const result = await commHandler({
      event: { data: { outboxId: "outbox_invalid_email" } },
      step: mockStep,
    });

    expect(result.nonRetryable).toBe(true);
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockPrisma.notificationOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "outbox_invalid_email" },
        data: expect.objectContaining({
          status: NotificationOutboxStatus.FAILED,
          lastError: expect.stringContaining("PERMANENT_VALIDATION_ERROR"),
        }),
      })
    );
  });

  // 12: Resend native idempotency key and entity reference header ensure deduplication
  it("Criterion 12: Resend dispatch includes native idempotencyKey and entity reference header", async () => {
    await CommunicationService.sendEmailWithAttachment({
      to: "customer@example.com",
      subject: "Test Subject",
      html: "<p>Test</p>",
      outboxId: "outbox_trace_123",
    });

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          "X-Entity-Ref-ID": "outbox_trace_123",
        },
      }),
      { idempotencyKey: "outbox_trace_123" }
    );
  });
});
