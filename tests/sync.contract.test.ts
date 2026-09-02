import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncService } from "../src/services/sync.service";
import { ProductRepository } from "../src/repositories/product.repository";
import { client } from "../sanity/lib/client";
import prisma from "../src/lib/prisma";

vi.mock("../sanity/lib/client", () => {
  const mockClient = {
    withConfig: vi.fn(() => mockClient),
    fetch: vi.fn(),
  };
  return { client: mockClient };
});

vi.mock("../src/repositories/product.repository", () => ({
  ProductRepository: {
    upsertProductBySanityId: vi.fn(),
    archiveProductBySanityId: vi.fn(),
  },
}));

vi.mock("../src/lib/prisma", () => ({
  default: {
    product: {
      findUnique: vi.fn(),
    },
  },
}));

describe("SyncService Contract Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("missing required field throws safely", async () => {
    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "missing-price",
      name: "Valid Title",
      slug: "valid-slug",
      category: "Valid Category",
      price: null, // missing required field
      wood: "Mahogany",
      image: "https://example.com/image.png",
      availability: "Available",
    });

    await expect(
      SyncService.reconcileProductBySanityId("missing-price")
    ).rejects.toThrow(/Missing required field: price/);
  });

  it("valid standard non-MTO payload processes correctly", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "valid-id" } as any;
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "valid-id",
      name: "Valid Title",
      slug: "valid-slug",
      category: "Valid Category",
      price: 100,
      wood: "Mahogany",
      image: "https://example.com/image.png",
      dimensions: { length: 10, width: 5, height: 2 },
      description: "Short description",
      availability: "Available",
      leadTimeDays: null,
      shippingType: "STANDARD",
    });

    const result = await SyncService.reconcileProductBySanityId("valid-id");

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.id).toBe("valid-id");
    expect(capturedPayload.data.name).toBe("Valid Title");
    expect(capturedPayload.data.slug).toBe("valid-slug");
    expect(capturedPayload.data.price).toBe(100);
    expect(capturedPayload.data.dimensions).toBe('10" L × 5" W × 2" H');
    expect(capturedPayload.data.isMto).toBe(false);
    expect(capturedPayload.data.inStock).toBe(true);
    expect(capturedPayload.data.baseLeadTimeDays).toBe(30);
    expect(capturedPayload.data.additionalUnitLeadTimeDays).toBe(10);
    expect(result).toBe("CREATED");
  });

  it("valid MTO payload with explicit leadTimeDays processes correctly", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "mto-id" } as any;
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-id",
      name: "MTO Artisan Desk",
      slug: "mto-artisan-desk",
      category: "Desks",
      price: 45000,
      wood: "Teak",
      image: "https://example.com/desk.png",
      dimensions: { length: 60, width: 30, height: 30 },
      description: "Handcrafted MTO desk",
      availability: "Made-to-Order",
      leadTimeDays: 45,
      shippingType: "LARGE",
    });

    const result = await SyncService.reconcileProductBySanityId("mto-id");

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.id).toBe("mto-id");
    expect(capturedPayload.data.isMto).toBe(true);
    expect(capturedPayload.data.inStock).toBe(true);
    expect(capturedPayload.data.baseLeadTimeDays).toBe(45);
    expect(capturedPayload.data.additionalUnitLeadTimeDays).toBe(10);
    expect(result).toBe("CREATED");
  });

  it("valid MTO payload with null leadTimeDays falls back to approved 30-day default", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "clPgbyXUNMJiWikZuWZubV" } as any;
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    // Exact RG-001 Sanity document shape
    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "clPgbyXUNMJiWikZuWZubV",
      name: "RG-001 Center Coffee Table",
      slug: "rg-001-center-coffee-table",
      category: "Coffee Tables",
      price: 31000,
      wood: "Sheesham",
      image: "https://cdn.sanity.io/images/uuu315g5/production/rg-001.png",
      dimensions: { length: 48, width: 24, height: 18 },
      description: "Center table",
      availability: "Made-to-Order",
      leadTimeDays: null,
      shippingType: "MEDIUM",
    });

    const result = await SyncService.reconcileProductBySanityId("clPgbyXUNMJiWikZuWZubV");

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.data.isMto).toBe(true);
    expect(capturedPayload.data.inStock).toBe(true);
    expect(capturedPayload.data.baseLeadTimeDays).toBe(30);
    expect(capturedPayload.data.additionalUnitLeadTimeDays).toBe(10);
    expect(result).toBe("CREATED");
  });

  it("valid MTO payload with undefined leadTimeDays falls back to approved 30-day default", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "mto-undef" } as any;
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-undef",
      name: "MTO Undefined Lead",
      slug: "mto-undef-lead",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: undefined,
      shippingType: "STANDARD",
    });

    const result = await SyncService.reconcileProductBySanityId("mto-undef");
    expect(capturedPayload.data.baseLeadTimeDays).toBe(30);
    expect(result).toBe("CREATED");
  });

  it("valid MTO payload with leadTimeDays = 0 safely falls back to approved 30-day default", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "mto-zero" } as any;
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-zero",
      name: "MTO Zero Lead",
      slug: "mto-zero-lead",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: 0,
      shippingType: "STANDARD",
    });

    const result = await SyncService.reconcileProductBySanityId("mto-zero");
    expect(capturedPayload.data.baseLeadTimeDays).toBe(30);
    expect(result).toBe("CREATED");
  });

  it("valid MTO payload with leadTimeDays = 1 preserves explicit 1-day lead time", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "mto-one" } as any;
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-one",
      name: "MTO One Day Lead",
      slug: "mto-one-lead",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: 1,
      shippingType: "STANDARD",
    });

    const result = await SyncService.reconcileProductBySanityId("mto-one");
    expect(capturedPayload.data.baseLeadTimeDays).toBe(1);
    expect(result).toBe("CREATED");
  });

  it("valid MTO payload with leadTimeDays = 30 preserves explicit 30-day lead time", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "mto-thirty" } as any;
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-thirty",
      name: "MTO Thirty Day Lead",
      slug: "mto-thirty-lead",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: 30,
      shippingType: "STANDARD",
    });

    const result = await SyncService.reconcileProductBySanityId("mto-thirty");
    expect(capturedPayload.data.baseLeadTimeDays).toBe(30);
    expect(result).toBe("CREATED");
  });

  it("valid MTO payload with negative leadTimeDays safely falls back to 30", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "mto-neg" } as any;
    });
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-neg",
      name: "MTO Negative Lead",
      slug: "mto-neg-lead",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: -5,
      shippingType: "STANDARD",
    });

    const result = await SyncService.reconcileProductBySanityId("mto-neg");
    expect(capturedPayload.data.baseLeadTimeDays).toBe(30);
    expect(result).toBe("CREATED");
  });

  it("valid MTO payload with decimal leadTimeDays (1.5, 30.5) safely falls back to 30", async () => {
    let capturedPayload1: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload1 = { id, data };
      return { id: "mto-dec-1" } as any;
    });
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-dec-1",
      name: "MTO Dec 1",
      slug: "mto-dec-1",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: 1.5,
      shippingType: "STANDARD",
    });

    await SyncService.reconcileProductBySanityId("mto-dec-1");
    expect(capturedPayload1.data.baseLeadTimeDays).toBe(30);

    let capturedPayload2: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload2 = { id, data };
      return { id: "mto-dec-2" } as any;
    });
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-dec-2",
      name: "MTO Dec 2",
      slug: "mto-dec-2",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: 30.5,
      shippingType: "STANDARD",
    });

    await SyncService.reconcileProductBySanityId("mto-dec-2");
    expect(capturedPayload2.data.baseLeadTimeDays).toBe(30);
  });

  it("valid MTO payload with NaN or Infinity leadTimeDays safely falls back to 30", async () => {
    let capturedPayload1: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload1 = { id, data };
      return { id: "mto-nan" } as any;
    });
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-nan",
      name: "MTO NaN Lead",
      slug: "mto-nan-lead",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: NaN,
      shippingType: "STANDARD",
    });

    await SyncService.reconcileProductBySanityId("mto-nan");
    expect(capturedPayload1.data.baseLeadTimeDays).toBe(30);

    let capturedPayload2: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload2 = { id, data };
      return { id: "mto-inf" } as any;
    });
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "mto-inf",
      name: "MTO Inf Lead",
      slug: "mto-inf-lead",
      category: "Tables",
      price: 20000,
      wood: "Teak",
      image: "https://example.com/img.png",
      dimensions: "40x20",
      description: "Desc",
      availability: "Made-to-Order",
      leadTimeDays: Infinity,
      shippingType: "STANDARD",
    });

    await SyncService.reconcileProductBySanityId("mto-inf");
    expect(capturedPayload2.data.baseLeadTimeDays).toBe(30);
  });

  it("valid Sold payload marks inStock as false and isMto as false", async () => {
    let capturedPayload: any = null;
    vi.mocked(ProductRepository.upsertProductBySanityId).mockImplementation(async (id, data) => {
      capturedPayload = { id, data };
      return { id: "sold-id" } as any;
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({ id: "sold-id", isActive: true } as any);

    (vi.mocked(client.fetch) as any).mockResolvedValueOnce({
      _id: "sold-id",
      name: "Sold Table",
      slug: "sold-table",
      category: "Tables",
      price: 20000,
      wood: "Oak",
      image: "https://example.com/sold.png",
      dimensions: "Unknown",
      description: "Sold item",
      availability: "Sold",
      leadTimeDays: null,
      shippingType: "STANDARD",
    });

    const result = await SyncService.reconcileProductBySanityId("sold-id");

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.data.inStock).toBe(false);
    expect(capturedPayload.data.isMto).toBe(false);
    expect(result).toBe("UPDATED");
  });

  it("absent authoritative product archives", async () => {
    vi.mocked(ProductRepository.archiveProductBySanityId).mockResolvedValueOnce("ARCHIVED");

    // Both primary query and stale-mitigation confirmation query return null
    (vi.mocked(client.fetch) as any).mockResolvedValue(null);

    const result = await SyncService.reconcileProductBySanityId("absent-id");

    expect(ProductRepository.archiveProductBySanityId).toHaveBeenCalledWith("absent-id");
    expect(result).toBe("ARCHIVED");
  });
});
