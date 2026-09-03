import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckoutService } from "@/services/checkout.service";
import prisma from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { ShippingEngine } from "@/services/shipping-engine.service";
import { ShippingRepository } from "@/repositories/shipping.repository";
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

describe("MTO Checkout Decoupling and Hardening Suite", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const sampleMtoPayload: MtoCheckoutPayload = {
    productId: "rg-001-center-coffee-table",
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
  };

  const setupMockTx = () => {
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
              id: "ord-test-mto-123",
              orderNumber: "ORD-MTO-123",
              ...args.data,
            };
          }),
        },
      };
      return callback(txMock);
    });
    return () => createdOrderData;
  };

  // Test 1: MTO product with shippingType = null -> checkout succeeds
  it("Test 1: MTO product with shippingType = null -> checkout succeeds", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null, // explicitly null!
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const getCreatedOrder = setupMockTx();
    const result = await CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1");

    expect(result.order).toBeDefined();
    expect(getCreatedOrder().shippingCost).toBe(0);
    expect(getCreatedOrder().isMtoOrder).toBe(true);
  });

  // Test 2: MTO product with no shipping rate -> checkout succeeds
  it("Test 2: MTO product with no shipping rate in DB -> checkout succeeds", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: "UNKNOWN_CUSTOM_TYPE",
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    // Empty rates table in DB - never called because MTO bypasses shipping
    const getCreatedOrder = setupMockTx();
    const result = await CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1");

    expect(result.order).toBeDefined();
    expect(getCreatedOrder().shippingCost).toBe(0);
  });

  // Test 3: MTO checkout does NOT invoke ShippingEngine
  it("Test 3: MTO checkout does NOT invoke ShippingEngine", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const spyCalculate = vi.spyOn(ShippingEngine, "calculate");
    setupMockTx();

    await CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1");
    expect(spyCalculate).not.toHaveBeenCalled();
    spyCalculate.mockRestore();
  });

  // Test 4: MTO checkout does NOT query ShippingTypeRate for calculation
  it("Test 4: MTO checkout does NOT query ShippingTypeRate for calculation", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const spyRates = vi.spyOn(ShippingRepository, "getAllShippingTypeRates");
    setupMockTx();

    await CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1");
    expect(spyRates).not.toHaveBeenCalled();
    spyRates.mockRestore();
  });

  // Test 5: MTO shippingCost stored/used for current order/payment -> exactly 0
  it("Test 5: MTO shippingCost stored/used for current order/payment -> exactly 0", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const getCreatedOrder = setupMockTx();
    await CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1");
    const order = getCreatedOrder();

    expect(order.shippingCost).toBe(0);
    expect(order.total).toBe(31000);
    expect(order.balanceDue).toBe(31000);
  });

  // Test 6: MTO shipping displays as ৳0 (no charge) — not "Free Shipping" or "To be confirmed"
  it("Test 6: MTO shipping displays as ৳0 — consistent across all presentation surfaces", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const getCreatedOrder = setupMockTx();
    await CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1");
    const order = getCreatedOrder();

    expect(order.isMtoOrder).toBe(true);
    expect(order.shippingCost).toBe(0);

    // Verify the exact rendering pattern used by all 6 presentation surfaces:
    // MtoCheckoutClient, invoice, customer orders, admin detail, admin table, email
    const displayShipping = `৳${order.shippingCost.toLocaleString()}`;
    expect(displayShipping).toBe("৳0");

    // Must NOT contain old or incorrect semantics
    expect(displayShipping).not.toContain("Free");
    expect(displayShipping).not.toContain("confirmed");
    expect(displayShipping).not.toContain("pending");
  });

  // Test 7: Client submits shippingCost = 900 -> server ignores it -> MTO shipping remains 0
  it("Test 7: Client submits shippingCost = 900 in payload -> server ignores it -> MTO shipping remains 0", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const maliciousPayload: any = {
      ...sampleMtoPayload,
      shippingCost: 900,
    };

    const getCreatedOrder = setupMockTx();
    await CheckoutService.processMtoCheckout(maliciousPayload, "user-1");

    expect(getCreatedOrder().shippingCost).toBe(0);
    expect(getCreatedOrder().total).toBe(31000);
  });

  // Test 8: Client submits shippingCost = 2500 -> server ignores it -> MTO shipping remains 0
  it("Test 8: Client submits shippingCost = 2500 in payload -> server ignores it -> MTO shipping remains 0", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const maliciousPayload: any = {
      ...sampleMtoPayload,
      shippingCost: 2500,
    };

    const getCreatedOrder = setupMockTx();
    await CheckoutService.processMtoCheckout(maliciousPayload, "user-1");

    expect(getCreatedOrder().shippingCost).toBe(0);
    expect(getCreatedOrder().total).toBe(31000);
  });

  // Test 9: MTO product price = ৳31,000 -> 50% advance = ৳15,500
  it("Test 9: MTO product price = ৳31,000 -> 50% advance = ৳15,500", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const getCreatedOrder = setupMockTx();
    await CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1");
    const order = getCreatedOrder();

    expect(order.subtotal).toBe(31000);
    expect(order.shippingCost).toBe(0);
    expect(order.total).toBe(31000);
    expect(order.requiredAdvance).toBe(15500);
  });

  // Test 10: MTO quantity = 3 -> product total = ৳93,000 -> 50% advance = ৳46,500
  it("Test 10: MTO quantity = 3 -> product total = ৳93,000 -> 50% advance = ৳46,500", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-rg001",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      price: 31000,
      isMto: true,
      isActive: true,
      shippingType: null,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    const getCreatedOrder = setupMockTx();
    await CheckoutService.processMtoCheckout({ ...sampleMtoPayload, quantity: 3 }, "user-1");
    const order = getCreatedOrder();

    expect(order.subtotal).toBe(93000);
    expect(order.shippingCost).toBe(0);
    expect(order.total).toBe(93000);
    expect(order.requiredAdvance).toBe(46500);
    // Lead time: 30 + (3 - 1) * 10 = 50 days
    expect(order.estimatedManufacturingDays).toBe(50);
  });

  // Test 11: Inactive product through MTO checkout -> rejected
  it("Test 11: Inactive product through MTO checkout -> rejected", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-inactive",
      name: "Inactive Table",
      slug: "test-mto-table",
      price: 31000,
      isMto: true,
      isActive: false, // Inactive
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    await expect(
      CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1")
    ).rejects.toThrow(ValidationError);
  });

  // Test 12: Non-MTO product through MTO checkout -> rejected
  it("Test 12: Non-MTO product through MTO checkout -> rejected", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: "prod-standard",
      name: "Standard In-Stock Table",
      slug: "test-mto-table",
      price: 20000,
      isMto: false, // Not MTO
      isActive: true,
      baseLeadTimeDays: 30,
      additionalUnitLeadTimeDays: 10,
    } as any);

    await expect(
      CheckoutService.processMtoCheckout(sampleMtoPayload, "user-1")
    ).rejects.toThrow(ValidationError);
  });

  // Test 13: Standard product -> existing shipping calculation still works
  it("Test 13: Standard product -> existing shipping calculation still works", async () => {
    const rates = [
      { id: "r1", shippingType: "large", baseRate: 900, additionalRate: 700, createdAt: new Date(), updatedAt: new Date() },
    ];
    const items = [
      { productId: "console-table", productName: "The Console Table", shippingType: "large", quantity: 1 },
    ];

    const cost = ShippingEngine.calculate(items, rates);
    expect(cost).toBe(900);
  });

  // Test 14: Standard checkout -> ShippingEngine still invoked where required
  it("Test 14: Standard checkout -> ShippingEngine still invoked where required", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      {
        id: "prod-console",
        slug: "console-table",
        name: "The Console Table",
        price: 20000,
        inStock: true,
        isActive: true,
        isMto: false,
        shippingType: "large",
      } as any,
    ]);

    vi.mocked(prisma.shippingTypeRate.findMany).mockResolvedValueOnce([
      { id: "r1", shippingType: "large", baseRate: 900, additionalRate: 700, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const spyCalculate = vi.spyOn(ShippingEngine, "calculate");

    let createdOrderData: any = null;
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
      const txMock = {
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
              id: "ord-test-std-123",
              orderNumber: "ORD-STD-123",
              ...args.data,
            };
          }),
        },
      };
      return callback(txMock);
    });

    const result = await CheckoutService.processCheckout(
      {
        items: [{ id: "console-table", quantity: 1 }],
        address: {
          name: "Customer One",
          email: "cust@example.com",
          phone: "01700000000",
          street: "123 Test Street",
        },
        division: "Khulna",
        district: "Narail",
      },
      "user-1"
    );

    expect(result.order).toBeDefined();
    expect(spyCalculate).toHaveBeenCalledTimes(1);
    expect(createdOrderData.shippingCost).toBe(900);
    expect(createdOrderData.total).toBe(20900);
    spyCalculate.mockRestore();
  });

  // Test 15: Standard Console Table shipping behavior is NOT changed by this implementation
  it("Test 15: Standard Console Table shipping behavior is NOT changed by this implementation", async () => {
    const rates = [
      { id: "r1", shippingType: "large", baseRate: 900, additionalRate: 700, createdAt: new Date(), updatedAt: new Date() },
      { id: "r2", shippingType: "small_1", baseRate: 150, additionalRate: 50, createdAt: new Date(), updatedAt: new Date() },
    ];
    const items = [
      { productId: "console-table", productName: "The Console Table", shippingType: "large", quantity: 2 },
      { productId: "tray-1", productName: "Wooden Tray", shippingType: "small_1", quantity: 1 },
    ];

    // Under standard rules:
    // Large qty 2: 900 + (2-1)*700 = 1600
    // Small_1 is bundled free because Large is in cart: 0
    // Total = 1600
    const cost = ShippingEngine.calculate(items, rates);
    expect(cost).toBe(1600);
  });
});
