import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { CheckoutService } from "@/services/checkout.service";
import { MtoCheckoutPayload } from "@/validations/mto-checkout.schema";
import { inngest } from "@/inngest/client";
import { IdempotencyClaimConflictSignal } from "@/lib/persistence/idempotency";

vi.mock("@/inngest/client", () => {
  return {
    inngest: {
      send: vi.fn().mockResolvedValue({}),
    },
  };
});

describe("MTO Checkout Idempotency Suite", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clean up DB for clean test state
    await prisma.notificationOutbox.deleteMany();
    await prisma.orderEvent.deleteMany();
    await prisma.paymentRecord.deleteMany();
    await prisma.orderDocument.deleteMany();
    await prisma.priceRevision.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.idempotencyKey.deleteMany();
    await prisma.user.deleteMany({
      where: {
        id: {
          in: ["user-1", "user-999", "user-A", "user-B", "user-C"]
        }
      }
    });

    // Create test users
    const users = ["user-1", "user-999", "user-A", "user-B", "user-C"];
    for (const u of users) {
      await prisma.user.create({
        data: {
          id: u,
          email: `${u}@example.com`,
          name: `Test ${u}`,
        }
      });
    }
  });

  const generateValidPayload = (key: string, product: string = "rg-001-center-coffee-table"): MtoCheckoutPayload => ({
    productId: product,
    quantity: 1,
    division: "Dhaka",
    district: "Dhaka",
    address: {
      name: "Customer One",
      email: "cust@example.com",
      phone: "01700000000",
      street: "123 Test Street",
      postCode: "1200",
    },
    idempotencyKey: key,
  });

  it("TEST 1 — First request", async () => {
    const payload = generateValidPayload("key-test-1");
    const res = await CheckoutService.processMtoCheckout(payload, "user-1");

    expect(res.order.id).toBeDefined();
    expect(res.order.orderNumber).toBeDefined();

    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(1);
    
    const items = await prisma.orderItem.findMany();
    expect(items).toHaveLength(1);

    const docs = await prisma.orderDocument.findMany();
    expect(docs).toHaveLength(1);

    const outbox = await prisma.notificationOutbox.findMany();
    expect(outbox).toHaveLength(1);

    const events = await prisma.orderEvent.findMany();
    expect(events).toHaveLength(1);

    const ik = await prisma.idempotencyKey.findFirst({ where: { key: "key-test-1" } });
    expect(ik?.status).toBe("COMPLETED");
  });

  it("TEST 2 — Sequential duplicate", async () => {
    const payload = generateValidPayload("key-test-2");
    const res1 = await CheckoutService.processMtoCheckout(payload, "user-1");
    const res2 = await CheckoutService.processMtoCheckout(payload, "user-1");

    expect(res2.order.id).toBe(res1.order.id);
    expect(res2.order.orderNumber).toBe(res1.order.orderNumber);

    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(1); // Only 1 order created
  });

  it("TEST 3 — Same key + different payload", async () => {
    const payload1 = generateValidPayload("key-test-3");
    const payload2 = generateValidPayload("key-test-3");
    payload2.quantity = 2; // different payload

    await CheckoutService.processMtoCheckout(payload1, "user-1");

    await expect(CheckoutService.processMtoCheckout(payload2, "user-1"))
      .rejects.toThrow("IDEMPOTENCY_CONFLICT");

    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(1);
  });

  it("TEST 4 — Concurrent duplicate", async () => {
    const payload = generateValidPayload("key-test-4");
    
    const results = await Promise.allSettled([
      CheckoutService.processMtoCheckout(payload, "user-1"),
      CheckoutService.processMtoCheckout(payload, "user-1"),
      CheckoutService.processMtoCheckout(payload, "user-1")
    ]);

    const successes = results.filter(r => r.status === "fulfilled") as PromiseFulfilledResult<any>[];
    const errors = results.filter(r => r.status === "rejected") as PromiseRejectedResult[];

    // Due to optimistic concurrency / conflict signals, they all might succeed and return same order
    // Or some might fail with conflict depending on timing, but exactly 1 order must be created.
    expect(successes.length).toBeGreaterThan(0);
    
    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(1);
    
    // Ensure all successful ones got the same order ID
    const orderId = successes[0].value.order.id;
    for (const s of successes) {
      expect(s.value.order.id).toBe(orderId);
    }
  });

  it("TEST 5 — Transaction failure", async () => {
    const payload = generateValidPayload("key-test-5");
    
    // Force a failure inside the transaction by wrapping the real transaction
    let didThrow = false;
    vi.spyOn(prisma, "$transaction").mockImplementationOnce(async (callback: any) => {
      // Execute the real transaction but force it to roll back by throwing at the end
      const originalTx = vi.mocked(prisma.$transaction).getMockImplementation() || prisma.$transaction;
      vi.mocked(prisma.$transaction).mockRestore(); // Restore so we can call the real one
      
      try {
        await prisma.$transaction(async (tx) => {
          await callback(tx);
          didThrow = true;
          throw new Error("Simulated DB Failure");
        });
      } catch (err: any) {
        throw err;
      }
    });

    await expect(CheckoutService.processMtoCheckout(payload, "user-1")).rejects.toThrow("Simulated DB Failure");
    expect(didThrow).toBe(true);

    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(0); // transaction rolled back

    const keys = await prisma.idempotencyKey.findMany({ where: { key: "key-test-5" } });
    expect(keys).toHaveLength(0); // idempotency claim rolled back

    // Retry succeeds
    const res = await CheckoutService.processMtoCheckout(payload, "user-1");
    expect(res.order.id).toBeDefined();
    
    const finalOrders = await prisma.order.findMany();
    expect(finalOrders).toHaveLength(1);
  });

  it("TEST 6 — Response lost / retry simulation", async () => {
    const payload = generateValidPayload("key-test-6");
    const res1 = await CheckoutService.processMtoCheckout(payload, "user-1");
    
    // Simulate frontend retry
    const res2 = await CheckoutService.processMtoCheckout(payload, "user-1");
    
    expect(res2.order.id).toBe(res1.order.id);
    expect(res2.order.orderNumber).toBe(res1.order.orderNumber);
    
    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(1);
  });

  it("TEST 7 — Inngest failure", async () => {
    const payload = generateValidPayload("key-test-7");
    
    vi.mocked(inngest.send).mockRejectedValueOnce(new Error("Inngest down"));
    
    const res = await CheckoutService.processMtoCheckout(payload, "user-1");
    
    expect(res.order.id).toBeDefined(); // Order still successful
    
    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(1);

    const ik = await prisma.idempotencyKey.findFirst({ where: { key: "key-test-7" } });
    expect(ik?.status).toBe("COMPLETED"); // Transaction completed fine
  });

  it("TEST 8 — Guest", async () => {
    const payload = generateValidPayload("key-test-8");
    const res1 = await CheckoutService.processMtoCheckout(payload, null);
    const res2 = await CheckoutService.processMtoCheckout(payload, null);
    
    expect(res2.order.id).toBe(res1.order.id);
    
    const ik = await prisma.idempotencyKey.findFirst({ where: { key: "key-test-8" } });
    expect(ik?.ownerType).toBe("GUEST");
    expect(ik?.ownerId).toBe("ANONYMOUS_GUEST");
  });

  it("TEST 9 — Authenticated user", async () => {
    const payload = generateValidPayload("key-test-9");
    const res1 = await CheckoutService.processMtoCheckout(payload, "user-999");
    const res2 = await CheckoutService.processMtoCheckout(payload, "user-999");
    
    expect(res2.order.id).toBe(res1.order.id);
    
    const ik = await prisma.idempotencyKey.findFirst({ where: { key: "key-test-9" } });
    expect(ik?.ownerType).toBe("USER");
    expect(ik?.ownerId).toBe("user-999");
  });

  it("TEST 10 — Different users same key", async () => {
    const payload = generateValidPayload("key-shared");
    
    const res1 = await CheckoutService.processMtoCheckout(payload, "user-A");
    const res2 = await CheckoutService.processMtoCheckout(payload, "user-B");
    
    expect(res1.order.id).not.toBe(res2.order.id); // Different orders
    
    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(2); // Both created successfully
  });

  it("TEST 11 — Guest vs User same key", async () => {
    const payload = generateValidPayload("key-shared-2");
    
    const res1 = await CheckoutService.processMtoCheckout(payload, null); // GUEST
    const res2 = await CheckoutService.processMtoCheckout(payload, "user-C"); // USER
    
    expect(res1.order.id).not.toBe(res2.order.id); // Different orders
    
    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(2); // Both created successfully
  });
});
