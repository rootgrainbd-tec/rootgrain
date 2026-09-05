import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/checkout/mto/route';
import { Prisma } from '@prisma/client';
import { getServerSession } from "next-auth";
import { CheckoutService } from "@/services/checkout.service";
import * as idempotency from "@/lib/persistence/idempotency";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { getSiteConfig } from "@/data/site-config";
import { PromoRepository } from "@/repositories/promo.repository";
import { generateGuestTrackingToken, hashGuestTrackingToken } from "@/lib/capability-token";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn() },
}));

vi.mock("@/data/site-config", () => ({
  getSiteConfig: vi.fn().mockResolvedValue({
    name: "Test",
    address: "Test Address",
    support: { email: "test@test.com", phone: { display: "017" } }
  }),
}));

vi.mock("@/lib/persistence/idempotency", async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    claimIdempotencyKey: vi.fn().mockResolvedValue(true),
    completeIdempotencyKey: vi.fn().mockResolvedValue(true),
    recoverIdempotencyKey: vi.fn(),
  };
});

describe('MTO Forensic Instrument v2', () => {
  const validPayload = {
    productId: "rg-001-center-coffee-table",
    quantity: 1,
    division: "Dhaka",
    district: "Dhaka",
    address: {
      name: "Test User",
      email: "test@test.com",
      phone: "01711000000",
      street: "Test St",
    },
    idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
    _diagnostic: true,
  };

  const createRequest = (body: any) => {
    return new Request("http://localhost/api/checkout/mto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as any).mockResolvedValue(null);
  });

  it('1. successful MTO execution', async () => {
    const req = createRequest(validPayload);
    const mockOrder = { id: "ord-1", orderNumber: "RG-123" };
    
    vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({
      id: "prod-1", name: "Table", slug: "rg-001-center-coffee-table",
      price: 10000, isActive: true, isMto: true, inStock: true,
      baseLeadTimeDays: 10, additionalUnitLeadTimeDays: 5
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
      const tx = {
        promoCode: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        order: { create: vi.fn().mockResolvedValue(mockOrder) },
        orderEvent: { 
          create: vi.fn().mockResolvedValue({ id: "evt-1" }),
          aggregate: vi.fn().mockResolvedValue({ _max: { version: 0 } }),
          findFirst: vi.fn().mockResolvedValue(null)
        },
        notificationOutbox: { create: vi.fn().mockResolvedValue({ id: "out-1" }), upsert: vi.fn().mockResolvedValue({ id: "out-1" }) },
        orderDocument: { create: vi.fn().mockResolvedValue({ id: "doc-1" }) },
      } as any;
      return cb(tx);
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.diagnostic).toBe(true);
    expect(data.success).toBe(true);
    expect(data.commitBoundary).toBe("AFTER_COMMIT");
    expect(data.transactionCommitted).toBe(true);
    expect(data.inngestDispatchStarted).toBe(true);
    expect(data.inngestDispatchCompleted).toBe(true);
    expect(data.databaseEvidence.orderCreated).toBe(true);
    expect(data.databaseEvidence.orderId).toBe("ord-1");
    expect(data.databaseEvidence.idempotencyClaimed).toBe(true);
    
    const stages = data.stages.map((s: any) => s.stage);
    expect(stages).toContain("S0_REQUEST_RECEIVED");
    expect(stages).toContain("S17_RESPONSE");
  });

  it('2. P2028 (Interactive Transaction Timeout)', async () => {
    const req = createRequest(validPayload);
    
    vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({
      id: "prod-1", name: "Table", slug: "rg-001-center-coffee-table",
      price: 10000, isActive: true, isMto: true, inStock: true,
    } as any);

    vi.spyOn(prisma, '$transaction').mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Transaction already closed", {
        code: 'P2028',
        clientVersion: '5.0',
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();

    expect(data.diagnostic).toBe(true);
    expect(data.success).toBe(false);
    expect(data.commitBoundary).toBe("BEFORE_TRANSACTION"); // Because it failed opening or executing tx
    expect(data.transactionCommitted).toBe(false);
    expect(data.error.class).toBe("PRISMA_KNOWN_ERROR");
    expect(data.error.code).toBe("P2028");
    expect(data.databaseEvidence.orderCreated).toBe(false);
  });

  it('3. P2002 (Unique Constraint Violation)', async () => {
    const req = createRequest(validPayload);
    
    vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({
      id: "prod-1", name: "Table", slug: "rg-001-center-coffee-table",
      price: 10000, isActive: true, isMto: true, inStock: true,
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
      const tx = {
        order: {
          create: vi.fn().mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Unique constraint", {
            code: 'P2002',
            clientVersion: '5.0',
          }))
        }
      } as any;
      return cb(tx);
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.diagnostic).toBe(true);
    expect(data.error.class).toBe("PRISMA_KNOWN_ERROR");
    expect(data.error.code).toBe("P2002");
    expect(data.commitBoundary).toBe("INSIDE_TRANSACTION");
  });

  it('4. post-commit Inngest failure', async () => {
    const req = createRequest(validPayload);
    const mockOrder = { id: "ord-1", orderNumber: "RG-123" };
    
    vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({
      id: "prod-1", name: "Table", slug: "rg-001-center-coffee-table",
      price: 10000, isActive: true, isMto: true, inStock: true,
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
      const tx = {
        promoCode: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        order: { create: vi.fn().mockResolvedValue(mockOrder) },
        orderEvent: { 
          create: vi.fn().mockResolvedValue({ id: "evt-1" }),
          aggregate: vi.fn().mockResolvedValue({ _max: { version: 0 } }),
          findFirst: vi.fn().mockResolvedValue(null)
        },
        notificationOutbox: { create: vi.fn().mockResolvedValue({ id: "out-1" }), upsert: vi.fn().mockResolvedValue({ id: "out-1" }) },
        orderDocument: { create: vi.fn().mockResolvedValue({ id: "doc-1" }) },
      } as any;
      return cb(tx);
    });

    // Make inngest.send fail
    (inngest.send as any).mockRejectedValue(new Error("Inngest Timeout"));

    const res = await POST(req);
    const data = await res.json();

    expect(data.diagnostic).toBe(true);
    expect(data.success).toBe(false);
    expect(data.error.class).toBe("AFTER_COMMIT_INNGEST_FAILURE");
    expect(data.transactionCommitted).toBe(true);
    expect(data.inngestDispatchStarted).toBe(true);
    expect(data.inngestDispatchCompleted).toBe(false);
  });

  it('5. unexpected exception', async () => {
    const req = createRequest(validPayload);
    
    vi.spyOn(prisma.product, 'findUnique').mockRejectedValue(new Error("Database disconnected"));

    const res = await POST(req);
    const data = await res.json();

    expect(data.diagnostic).toBe(true);
    expect(data.error.class).toBe("UNEXPECTED_ERROR");
    expect(data.error.safeMessage).toBe("Database disconnected");
    expect(data.transactionCommitted).toBe(false);
  });
});
