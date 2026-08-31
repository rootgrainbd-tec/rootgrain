import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { MtoAdminService } from "@/services/mto-admin.service";
import prisma from "@/lib/prisma";

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn() }
}));

describe("Phase 6: Final Invoice Implementation Tests", () => {
  let testOrder: any;

  beforeAll(async () => {
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
        orderNumber: "TEST-FINV-" + Date.now(),
        isMtoOrder: true,
        status: "PROCESSING",
        productionState: "COMPLETE",
        deliveryState: "FINALIZED",
        trackingState: "DISPATCHED",
        total: 10000,
        subtotal: 9000,
        shippingCost: 1000,
        balanceDue: 10000,
        advancePaid: 0,
        legacyAdvancePaid: 0,
        requiredAdvance: 2000,
        shippingAddress: { name: "Integration Test" },
      },
    });

    // Create some payments to test balance logic
    await prisma.paymentRecord.create({
      data: {
        orderId: testOrder.id,
        amount: 2000,
        type: "ADVANCE",
        method: "CASH",
        status: "COMPLETED",
        reference: "TEST-REF-1",
        recordedById: "test-admin",
      }
    });
  });

  afterAll(async () => {
    if (testOrder) {
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

  it("Criterion 1: Should issue final invoice successfully when COMPLETE and FINALIZED", async () => {
    const { order, invoice, isNewInvoice } = await MtoAdminService.issueFinalInvoice(testOrder.id, "test-admin");
    
    expect(isNewInvoice).toBe(true);
    expect(invoice.documentType).toBe("FINAL_INVOICE");
    expect(invoice.referenceIdentity).toBe(`FINV-${order.orderNumber}-1`);
    
    const snapshot = invoice.snapshot as any;
    expect(snapshot.invoiceType).toBe("FINAL");
    expect(snapshot.validPaidAtIssuance).toBe(2000);
    expect(snapshot.balanceDueAtIssuance).toBe(8000); // 10000 - 2000

    // Ensure order is not mutated incorrectly
    expect(order.status).toBe("PROCESSING");
    
    const events = await prisma.orderEvent.findMany({ where: { orderId: testOrder.id, eventType: "FINAL_INVOICE_ISSUED" } });
    expect(events.length).toBe(1);

    // Check Notification Outbox
    const outbox = await prisma.notificationOutbox.findMany({ where: { orderId: testOrder.id, notificationType: "FINAL_INVOICE_AVAILABLE" } });
    expect(outbox.length).toBe(1);
  });

  it("Criterion 2: Should be idempotent", async () => {
    const { isNewInvoice, invoice } = await MtoAdminService.issueFinalInvoice(testOrder.id, "test-admin");
    
    expect(isNewInvoice).toBe(false);
    expect(invoice.documentType).toBe("FINAL_INVOICE");
  });
});
