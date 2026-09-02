import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckoutService } from "@/services/checkout.service";
import prisma from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import type { MtoCheckoutPayload } from "@/validations/mto-checkout.schema";

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    shippingTypeRate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { mockPrisma: mock };
});

vi.mock("@/lib/prisma", () => {
  return {
    default: mockPrisma,
    prisma: mockPrisma,
  };
});

vi.mock("@/inngest/client", () => {
  return {
    inngest: {
      send: vi.fn().mockResolvedValue({}),
    },
  };
});

describe("MTO Checkout Hardening Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const samplePayload: MtoCheckoutPayload = {
    productId: "test-mto-table",
    quantity: 1,
    division: "Dhaka",
    district: "Dhaka",
    address: {
      name: "Customer One",
      email: "cust@example.com",
      phone: "01700000000",
      street: "123 Street",
    },
  };

  it("1. missing product throws NotFoundError", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    await expect(
      CheckoutService.processMtoCheckout(samplePayload, "user-1")
    ).rejects.toThrow(NotFoundError);
  });

  it("2. inactive MTO product (isActive: false) throws ValidationError", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-inactive",
      name: "Inactive Table",
      slug: "test-mto-table",
      price: 31000,
      isMto: true,
      isActive: false, // Inactive!
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    await expect(
      CheckoutService.processMtoCheckout(samplePayload, "user-1")
    ).rejects.toThrow(/is not available for MTO direct buy/);
  });

  it("3. non-MTO product (isMto: false) throws ValidationError", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-non-mto",
      name: "Standard Table",
      slug: "test-mto-table",
      price: 20000,
      isMto: false, // Not MTO!
      isActive: true,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    await expect(
      CheckoutService.processMtoCheckout(samplePayload, "user-1")
    ).rejects.toThrow(/is not available for MTO direct buy/);
  });

  it("4. active MTO product calculates 50% advance and positive lead time fallback", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-active",
      name: "Active Table",
      slug: "test-mto-table",
      price: 30000,
      isMto: true,
      isActive: true,
      shippingType: "STANDARD",
      baseLeadTimeDays: 0, // 0 lead time in DB should fall back to 30
      additionalUnitLeadTimeDays: 0, // 0 should fall back to 10
    } as any);

    vi.mocked(prisma.shippingTypeRate.findUnique).mockResolvedValueOnce({
      shippingType: "STANDARD",
      baseRate: 200,
      additionalRate: 50,
    } as any);

    vi.mocked(prisma.shippingTypeRate.findMany).mockResolvedValueOnce([
      { shippingType: "STANDARD", baseRate: 200, additionalRate: 50 },
    ] as any);

    let createdOrderData: any = null;
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
      const txMock = {
        product: { findUnique: vi.fn() },
        promoCode: { findUnique: vi.fn() },
        orderEvent: {
          aggregate: vi.fn().mockResolvedValue({ _max: { sequence: 0 } }),
          create: vi.fn().mockResolvedValue({}),
        },
        notificationOutbox: {
          upsert: vi.fn().mockResolvedValue({}),
        },
        orderDocument: {
          create: vi.fn().mockResolvedValue({ id: "doc-123" }),
        },
        order: {
          create: vi.fn().mockImplementation((args) => {
            createdOrderData = args.data;
            return {
              id: "ord-test-123",
              orderNumber: "ORD-123",
              ...args.data,
            };
          }),
        },
      };
      return callback(txMock);
    });

    const result = await CheckoutService.processMtoCheckout(samplePayload, "user-1");

    expect(result.order).toBeDefined();
    expect(createdOrderData).not.toBeNull();
    // Subtotal 30000, Shipping 200 -> Total 30200
    // Advance = 50% of 30200 = 15100
    expect(createdOrderData.total).toBe(30200);
    expect(createdOrderData.requiredAdvance).toBe(15100);
    // Lead time fallback from 0 -> 30
    expect(createdOrderData.estimatedManufacturingDays).toBe(30);
  });

  it("5. standard cart checkout rejects MTO products with ValidationError", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      {
        id: "prod-mto-1",
        slug: "mto-item",
        name: "MTO Item",
        price: 15000,
        inStock: true,
        isActive: true,
        isMto: true, // MTO product
      } as any,
    ]);

    await expect(
      CheckoutService.processCheckout(
        {
          items: [{ id: "mto-item", quantity: 1 }],
          address: {
            name: "Customer One",
            email: "cust@example.com",
            phone: "01700000000",
            street: "123 Street",
          },
          division: "Dhaka",
          district: "Dhaka",
        },
        "user-1"
      )
    ).rejects.toThrow(ValidationError);
  });
});
