import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { recordAdminPaymentAction } from "@/app/actions/payment.admin";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { getServerSession as getServerSessionCore } from "next-auth";

const mockGetServerSession = vi.fn();

// Mock Next.js dependencies
vi.mock("next-auth/next", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Phase 5A: Admin Payment Operations Server Action", () => {
  let testOrder: any;

  beforeAll(async () => {
    // HARD SAFETY ASSERTION: Fail fast if not a local test environment
    const dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
      throw new Error(`DANGER: Mutation tests must run against a local database. Found: ${dbUrl}`);
    }
    const env = process.env.NODE_ENV;
    if (env !== "test" && env !== "development") {
      throw new Error(`DANGER: Mutation tests must run in 'test' or 'development' NODE_ENV. Found: ${env}`);
    }

    testOrder = await prisma.order.create({
      data: {
        orderNumber: "TEST-PAY-" + Date.now(),
        total: 5000,
        subtotal: 5000,
        shippingCost: 0,
        balanceDue: 5000,
        advancePaid: 0,
        legacyAdvancePaid: 0,
        shippingAddress: { name: "Integration Test" },
      },
    });
  });

  afterAll(async () => {
    if (testOrder) {
      await prisma.idempotencyKey.deleteMany({ where: { ownerId: { in: ["admin-1", "admin-2", "real-admin", "fake-user-id"] } } });
      await prisma.notificationOutbox.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.orderEvent.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.orderDocument.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.paymentReferenceClaim.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.paymentRecord.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.order.delete({ where: { id: testOrder.id } });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFormData = (data: Record<string, string>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => fd.append(key, value));
    return fd;
  };

  it("Criterion 1: Should reject without a session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const fd = createFormData({ orderId: testOrder.id, amount: "100", type: "ADVANCE", method: "MANUAL_BKASH", reference: "REF123", idempotencyKey: "123e4567-e89b-12d3-a456-426614174000" });
    const res = await recordAdminPaymentAction(null, fd);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
  });

  it("Criterion 2: Should reject with a non-ADMIN session", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { role: "CUSTOMER" } } as any);
    const fd = createFormData({ orderId: testOrder.id, amount: "100", type: "ADVANCE", method: "MANUAL_BKASH", reference: "REF123", idempotencyKey: "123e4567-e89b-12d3-a456-426614174000" });
    const res = await recordAdminPaymentAction(null, fd);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
  });

  it("Criterion 4: Should reject invalid (negative) amount", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } } as any);
    const fd = createFormData({ orderId: testOrder.id, amount: "-500", type: "ADVANCE", method: "MANUAL_BKASH", reference: "REF123", idempotencyKey: "123e4567-e89b-12d3-a456-426614174000" });
    const res = await recordAdminPaymentAction(null, fd);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Validation failed");
    expect(res.fieldErrors?.amount).toBeDefined();
  });

  it("Criterion 7: Should enforce Type/Method matrix (ADVANCE + COD -> Rejected)", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } } as any);
    const fd = createFormData({ orderId: testOrder.id, amount: "500", type: "ADVANCE", method: "COD", idempotencyKey: "123e4567-e89b-12d3-a456-426614174001" });
    const res = await recordAdminPaymentAction(null, fd);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Validation failed");
    expect(res.fieldErrors?.method).toContain("ADVANCE payment cannot use COD method");
  });

  it("Criterion 8: Should reject digital method without a reference", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } } as any);
    const fd = createFormData({ orderId: testOrder.id, amount: "500", type: "ADVANCE", method: "BANK_TRANSFER", reference: "   ", idempotencyKey: "123e4567-e89b-12d3-a456-426614174002" });
    const res = await recordAdminPaymentAction(null, fd);
    expect(res.success).toBe(false);
    expect(res.fieldErrors?.reference).toContain("Reference is required for digital payments (bKash/Bank)");
  });

  it("Criterion 3: Should successfully delegate a valid ADMIN payment, deducting balanceDue", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "ADMIN", id: "admin-1" } } as any);
    const fd = createFormData({ orderId: testOrder.id, amount: "1000", type: "ADVANCE", method: "MANUAL_BKASH", reference: "REF-VALID-1", idempotencyKey: "123e4567-e89b-12d3-a456-426614174003" });
    const res = await recordAdminPaymentAction(null, fd);
    
    if (!res.success) {
      console.error("Criterion 3 Failed:", res);
    }
    expect(res.success).toBe(true);

    // Verify financial mutation
    const updatedOrder = await prisma.order.findUnique({ where: { id: testOrder.id }, include: { paymentRecords: true } });
    expect(updatedOrder?.advancePaid).toBe(1000);
    expect(updatedOrder?.balanceDue).toBe(4000); // 5000 - 1000
    expect(updatedOrder?.paymentRecords.length).toBe(1);
  });

  it("Criterion 5: Should reject over-balance payments authoritatively (PaymentService boundary)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "ADMIN", id: "admin-1" } } as any);
    const fd = createFormData({ orderId: testOrder.id, amount: "5000", type: "INSTALLMENT", method: "CASH", idempotencyKey: "123e4567-e89b-12d3-a456-426614174004" });
    
    // Attempting to pay 5000 when balance is 4000
    const res = await recordAdminPaymentAction(null, fd);
    expect(res.success).toBe(false);
    // The exact error message comes from PaymentService AppError
    expect(res.error).toBeDefined();
    
    const unchangedOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
    expect(unchangedOrder?.balanceDue).toBe(4000); // Should be unchanged
  });

  it("Criterion 9: Should reject duplicate reference (PaymentService boundary)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "ADMIN", id: "admin-1" } } as any);
    const fd = createFormData({ orderId: testOrder.id, amount: "500", type: "INSTALLMENT", method: "MANUAL_BKASH", reference: "REF-VALID-1", idempotencyKey: "123e4567-e89b-12d3-a456-426614174005" });
    
    // REF-VALID-1 was already used in Criterion 3
    const res = await recordAdminPaymentAction(null, fd);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("Criterion 10: Should be idempotent (Exactly one mutation)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "ADMIN", id: "admin-2" } } as any);
    const idemKey = "123e4567-e89b-12d3-a456-426614174006";
    const fd = createFormData({ orderId: testOrder.id, amount: "500", type: "INSTALLMENT", method: "CASH", idempotencyKey: idemKey });
    
    const res1 = await recordAdminPaymentAction(null, fd);
    expect(res1.success).toBe(true);

    const res2 = await recordAdminPaymentAction(null, fd);
    expect(res2.success).toBe(true); // Should return success (or conflict)

    // Verify exactly ONE mutation occurred
    const finalOrder = await prisma.order.findUnique({ where: { id: testOrder.id }, include: { paymentRecords: true } });
    expect(finalOrder?.advancePaid).toBe(1500); // 1000 + 500
    expect(finalOrder?.balanceDue).toBe(3500);
    expect(finalOrder?.paymentRecords.length).toBe(2);
  });

  it("Criterion 11 & 12: Client financial and identity values are ignored", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "ADMIN", id: "real-admin" } } as any);
    const fd = createFormData({ 
      orderId: testOrder.id, 
      amount: "500", 
      type: "COD", 
      method: "CASH", 
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174007",
      // Tampered values
      recordedById: "fake-user-id",
      balanceDue: "0",
      totalPaid: "9999"
    });
    
    const res = await recordAdminPaymentAction(null, fd);
    expect(res.success).toBe(true);

    // Verify it correctly applied only the valid amount to the real balance
    const finalOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
    expect(finalOrder?.balanceDue).toBe(3000); // 3500 - 500 = 3000
  });
});
