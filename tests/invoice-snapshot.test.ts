import { describe, it, expect } from "vitest";
import {
  buildInvoiceSnapshot,
  buildShippingAddressSnapshot,
  buildInvoiceItemsSnapshot,
} from "@/lib/documentSnapshot";
import { generateInvoicePDF, generateReceiptPDF, formatCurrencyBDT } from "@/lib/pdfGenerator";
import { extractPDFText } from "./helpers/pdfTestUtils";

const mockSiteConfig = {
  name: "RootGrain",
  address: { line1: "123 Main St", line2: "Dhaka" },
  support: {
    email: "support@rootgrain.bd",
    phone: { display: "+880 1234567890" },
  },
};

const mockOrder = {
  id: "order-1",
  orderNumber: "RG-20261013-283096",
  total: 30040,
  subtotal: 29990,
  shippingCost: 50,
  discountAmount: 0,
  requiredAdvance: 6008,
  balanceDue: 30040,
  shippingAddress: {
    name: "Bilash",
    email: "bilash@example.com",
    phone: "01712345678",
    division: "Dhaka",
    district: "Dhaka",
    street: "123 Test Street",
    postCode: "1205",
  },
  items: [
    {
      productId: "prod-1",
      productName: "RootVana Sculpted Center Table",
      quantity: 1,
      unitPrice: 29990,
      total: 29990,
    },
  ],
};

describe("buildShippingAddressSnapshot", () => {
  it("should map checkout-format shipping address correctly", () => {
    const result = buildShippingAddressSnapshot(mockOrder.shippingAddress);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Bilash");
    expect(result!.phone).toBe("01712345678");
    expect(result!.address).toBe("123 Test Street"); // maps street -> address
    expect(result!.city).toBe("Dhaka"); // maps district -> city
    expect(result!.postalCode).toBe("1205"); // maps postCode -> postalCode
  });

  it("should return null for null/undefined input", () => {
    expect(buildShippingAddressSnapshot(null)).toBeNull();
    expect(buildShippingAddressSnapshot(undefined)).toBeNull();
  });

  it("should handle missing fields with empty string defaults", () => {
    const result = buildShippingAddressSnapshot({});
    expect(result).not.toBeNull();
    expect(result!.name).toBe("");
    expect(result!.address).toBe("");
    expect(result!.city).toBe("");
    expect(result!.postalCode).toBe("");
    expect(result!.phone).toBe("");
    expect(result!.apartment).toBeNull();
  });

  it("should handle MTO admin-format addresses (address field instead of street)", () => {
    const mtoAddress = {
      name: "Test",
      address: "456 MTO Street",
      city: "Chittagong",
      postalCode: "4000",
      phone: "01800000000",
    };
    const result = buildShippingAddressSnapshot(mtoAddress);
    expect(result!.address).toBe("456 MTO Street");
    expect(result!.city).toBe("Chittagong");
  });
});

describe("buildInvoiceItemsSnapshot", () => {
  it("should map order items correctly", () => {
    const result = buildInvoiceItemsSnapshot(mockOrder.items);
    expect(result).toHaveLength(1);
    expect(result[0].productName).toBe("RootVana Sculpted Center Table");
    expect(result[0].quantity).toBe(1);
    expect(result[0].unitPrice).toBe(29990);
    expect(result[0].total).toBe(29990);
    expect(result[0].productId).toBe("prod-1");
  });

  it("should return empty array for non-array input", () => {
    expect(buildInvoiceItemsSnapshot(null as any)).toEqual([]);
    expect(buildInvoiceItemsSnapshot(undefined as any)).toEqual([]);
    expect(buildInvoiceItemsSnapshot("not-array" as any)).toEqual([]);
  });

  it("should calculate total from unitPrice * quantity when total is missing", () => {
    const items = [{ productName: "Test", quantity: 3, unitPrice: 1000 }];
    const result = buildInvoiceItemsSnapshot(items);
    expect(result[0].total).toBe(3000);
  });

  it("should default quantity to 1 when missing", () => {
    const items = [{ productName: "Test", unitPrice: 500 }];
    const result = buildInvoiceItemsSnapshot(items);
    expect(result[0].quantity).toBe(1);
    expect(result[0].total).toBe(500);
  });
});

describe("buildInvoiceSnapshot", () => {
  it("should build a complete ADVANCE invoice snapshot from a checkout order", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      invoiceType: "ADVANCE",
      referenceIdentity: "INV-RG-20261013-283096-1",
    });

    // Core financial data
    expect(snapshot.invoiceType).toBe("ADVANCE");
    expect(snapshot.orderTotal).toBe(30040);
    expect(snapshot.requiredAdvance).toBe(6008);

    // Breakdown fields
    expect(snapshot.subtotal).toBe(29990);
    expect(snapshot.shippingCost).toBe(50);
    expect(snapshot.discountAmount).toBe(0);

    // Order identity
    expect(snapshot.orderNumber).toBe("RG-20261013-283096");
    expect(snapshot.referenceIdentity).toBe("INV-RG-20261013-283096-1");

    // Shipping address
    expect(snapshot.shippingAddress).not.toBeNull();
    expect(snapshot.shippingAddress!.name).toBe("Bilash");
    expect(snapshot.shippingAddress!.phone).toBe("01712345678");

    // Items
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].productName).toBe("RootVana Sculpted Center Table");
    expect(snapshot.items[0].quantity).toBe(1);
    expect(snapshot.items[0].unitPrice).toBe(29990);
    expect(snapshot.items[0].total).toBe(29990);

    // Customer email from shipping address
    expect(snapshot.customerEmail).toBe("bilash@example.com");

    // Branding
    expect(snapshot.branding.companyName).toBe("RootGrain");
    expect(snapshot.branding.email).toBe("support@rootgrain.bd");
    expect(snapshot.branding.phone).toBe("+880 1234567890");

    // Issued at
    expect(snapshot.issuedAt).toBeDefined();
    expect(() => new Date(snapshot.issuedAt)).not.toThrow();
  });

  it("should build a FINAL invoice snapshot with paid/balance fields", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      invoiceType: "FINAL",
      referenceIdentity: "FINV-RG-20261013-283096-1",
      validPaidAtIssuance: 6008,
      balanceDueAtIssuance: 24032,
    });

    expect(snapshot.invoiceType).toBe("FINAL");
    expect(snapshot.validPaidAtIssuance).toBe(6008);
    expect(snapshot.balanceDueAtIssuance).toBe(24032);
  });

  it("should fail validation if FINAL invoice is missing validPaidAtIssuance", () => {
    expect(() =>
      buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
        invoiceType: "FINAL",
        balanceDueAtIssuance: 24032,
      })
    ).toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");
  });

  it("should fail validation if FINAL invoice is missing balanceDueAtIssuance", () => {
    expect(() =>
      buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
        invoiceType: "FINAL",
        validPaidAtIssuance: 6008,
      })
    ).toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");
  });

  it("should fail validation if FINAL invoice has null settlement fields", () => {
    expect(() =>
      buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
        invoiceType: "FINAL",
        validPaidAtIssuance: null as any,
        balanceDueAtIssuance: 24032,
      })
    ).toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");

    expect(() =>
      buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
        invoiceType: "FINAL",
        validPaidAtIssuance: 6008,
        balanceDueAtIssuance: null as any,
      })
    ).toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");
  });

  it("should fail validation if FINAL invoice has NaN settlement fields", () => {
    expect(() =>
      buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
        invoiceType: "FINAL",
        validPaidAtIssuance: NaN,
        balanceDueAtIssuance: 24032,
      })
    ).toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");

    expect(() =>
      buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
        invoiceType: "FINAL",
        validPaidAtIssuance: 6008,
        balanceDueAtIssuance: NaN,
      })
    ).toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");
  });

  it("should fail validation if FINAL invoice has Infinity or -Infinity settlement fields", () => {
    expect(() =>
      buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
        invoiceType: "FINAL",
        validPaidAtIssuance: Infinity,
        balanceDueAtIssuance: 24032,
      })
    ).toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");

    expect(() =>
      buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
        invoiceType: "FINAL",
        validPaidAtIssuance: 6008,
        balanceDueAtIssuance: -Infinity,
      })
    ).toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");
  });

  it("should preserve legitimate zero values for FINAL invoice settlement fields", () => {
    // Zero advance paid before final invoice
    const zeroPaidSnapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      invoiceType: "FINAL",
      validPaidAtIssuance: 0,
      balanceDueAtIssuance: 30040,
    });
    expect(zeroPaidSnapshot.validPaidAtIssuance).toBe(0);
    expect(zeroPaidSnapshot.balanceDueAtIssuance).toBe(30040);

    // Fully settled / zero balance due
    const zeroBalanceSnapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      invoiceType: "FINAL",
      validPaidAtIssuance: 30040,
      balanceDueAtIssuance: 0,
    });
    expect(zeroBalanceSnapshot.validPaidAtIssuance).toBe(30040);
    expect(zeroBalanceSnapshot.balanceDueAtIssuance).toBe(0);
  });

  it("should default invoiceType to ADVANCE when not specified", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig);
    expect(snapshot.invoiceType).toBe("ADVANCE");
  });

  it("should auto-generate referenceIdentity from orderNumber when not provided", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig);
    expect(snapshot.referenceIdentity).toBe("INV-RG-20261013-283096-1");
  });

  it("should use custom issuedAt when provided", () => {
    const customDate = "2026-01-01T00:00:00.000Z";
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      issuedAt: customDate,
    });
    expect(snapshot.issuedAt).toBe(customDate);
  });

  it("should handle order with no items gracefully", () => {
    const orderNoItems = { ...mockOrder, items: [] };
    const snapshot = buildInvoiceSnapshot(orderNoItems, mockSiteConfig);
    expect(snapshot.items).toEqual([]);
  });

  it("should handle order with no shipping address", () => {
    const orderNoShipping = { ...mockOrder, shippingAddress: null };
    const snapshot = buildInvoiceSnapshot(orderNoShipping, mockSiteConfig);
    expect(snapshot.shippingAddress).toBeNull();
  });

  it("should handle missing total with zero default", () => {
    const orderNoTotal = { ...mockOrder, total: undefined };
    const snapshot = buildInvoiceSnapshot(orderNoTotal, mockSiteConfig);
    expect(snapshot.orderTotal).toBe(0);
  });

  it("should handle missing requiredAdvance with zero default", () => {
    const orderNoAdvance = { ...mockOrder, requiredAdvance: undefined };
    const snapshot = buildInvoiceSnapshot(orderNoAdvance, mockSiteConfig);
    expect(snapshot.requiredAdvance).toBe(0);
  });

  it("should omit subtotal/shippingCost/discountAmount when not present on order", () => {
    const bareOrder = {
      ...mockOrder,
      subtotal: undefined,
      shippingCost: undefined,
      discountAmount: undefined,
    };
    const snapshot = buildInvoiceSnapshot(bareOrder, mockSiteConfig);
    expect(snapshot.subtotal).toBeUndefined();
    expect(snapshot.shippingCost).toBeUndefined();
    expect(snapshot.discountAmount).toBeUndefined();
  });
});

describe("Regression: RG-20261013-283096 invoice PDF fields", () => {
  it("should NOT produce 'undefined Invoice' — invoiceType must be set", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      invoiceType: "ADVANCE",
    });
    expect(snapshot.invoiceType).toBe("ADVANCE");
    expect(snapshot.invoiceType).not.toBe(undefined);
  });

  it("should NOT show generic 'Customer' — name must come from shippingAddress", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig);
    expect(snapshot.shippingAddress?.name).toBe("Bilash");
    expect(snapshot.shippingAddress?.name).not.toBe("Customer");
  });

  it("should NOT show ৳0 total — orderTotal must be populated", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig);
    expect(snapshot.orderTotal).toBe(30040);
    expect(snapshot.orderTotal).not.toBe(0);
  });

  it("should NOT show ৳0 required advance", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig);
    expect(snapshot.requiredAdvance).toBe(6008);
    expect(snapshot.requiredAdvance).not.toBe(0);
  });

  it("should NOT have empty items array for an order with products", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig);
    expect(snapshot.items.length).toBeGreaterThan(0);
    expect(snapshot.items[0].productName).toBe("RootVana Sculpted Center Table");
  });

  it("should have phone and email populated", () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig);
    expect(snapshot.shippingAddress?.phone).toBe("01712345678");
    expect(snapshot.customerEmail).toBe("bilash@example.com");
  });
});

describe("generateInvoicePDF end-to-end with snapshot", () => {
  it("should generate a valid PDF buffer for order RG-20261013-283096", async () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      invoiceType: "ADVANCE",
    });
    const pdfBuffer = await generateInvoicePDF(snapshot, "1.0");
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // Verify PDF header magic bytes %PDF
    expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("should generate a valid PDF buffer for FINAL invoice", async () => {
    const snapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      invoiceType: "FINAL",
      validPaidAtIssuance: 6008,
      balanceDueAtIssuance: 24032,
    });
    const pdfBuffer = await generateInvoicePDF(snapshot, "1.0");
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("should preserve explicit zero item total without falling back to unitPrice * quantity", async () => {
    const orderWithFreeItem = {
      ...mockOrder,
      items: [
        {
          productId: "free-gift-1",
          productName: "Complimentary Care Kit",
          quantity: 2,
          unitPrice: 500,
          total: 0,
        },
      ],
    };

    const snapshot = buildInvoiceSnapshot(orderWithFreeItem, mockSiteConfig);
    expect(snapshot.items[0].total).toBe(0);

    const pdfBuffer = await generateInvoicePDF(snapshot, "1.0");
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("should reject PDF generation for FINAL invoice if settlement fields are missing", async () => {
    const malformedFinalSnapshot = {
      invoiceType: "FINAL" as const,
      orderTotal: 30040,
      requiredAdvance: 6008,
      items: [],
      branding: mockSiteConfig as any,
      issuedAt: new Date().toISOString(),
    };

    await expect(generateInvoicePDF(malformedFinalSnapshot as any, "1.0")).rejects.toThrow(
      "Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields"
    );
  });

  it("should generate a valid PDF buffer for FINAL invoice with legitimate zero settlement fields", async () => {
    // Zero advance paid, full balance due
    const zeroAdvanceSnapshot = {
      invoiceType: "FINAL" as const,
      orderTotal: 30040,
      requiredAdvance: 6008,
      validPaidAtIssuance: 0,
      balanceDueAtIssuance: 30040,
      items: [],
      branding: mockSiteConfig as any,
      issuedAt: new Date().toISOString(),
    };
    const pdfBuffer1 = await generateInvoicePDF(zeroAdvanceSnapshot as any, "1.0");
    expect(Buffer.isBuffer(pdfBuffer1)).toBe(true);
    expect(pdfBuffer1.subarray(0, 4).toString()).toBe("%PDF");

    // Fully settled, zero balance due
    const zeroBalanceSnapshot = {
      invoiceType: "FINAL" as const,
      orderTotal: 30040,
      requiredAdvance: 6008,
      validPaidAtIssuance: 30040,
      balanceDueAtIssuance: 0,
      items: [],
      branding: mockSiteConfig as any,
      issuedAt: new Date().toISOString(),
    };
    const pdfBuffer2 = await generateInvoicePDF(zeroBalanceSnapshot as any, "1.0");
    expect(Buffer.isBuffer(pdfBuffer2)).toBe(true);
    expect(pdfBuffer2.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("should reject PDF generation for FINAL invoice if settlement fields are non-finite or null", async () => {
    const baseSnapshot = {
      invoiceType: "FINAL" as const,
      orderTotal: 30040,
      requiredAdvance: 6008,
      items: [],
      branding: mockSiteConfig as any,
      issuedAt: new Date().toISOString(),
    };

    // NaN
    await expect(
      generateInvoicePDF({ ...baseSnapshot, validPaidAtIssuance: NaN, balanceDueAtIssuance: 24032 } as any, "1.0")
    ).rejects.toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");

    // Infinity
    await expect(
      generateInvoicePDF({ ...baseSnapshot, validPaidAtIssuance: 6008, balanceDueAtIssuance: Infinity } as any, "1.0")
    ).rejects.toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");

    // -Infinity
    await expect(
      generateInvoicePDF({ ...baseSnapshot, validPaidAtIssuance: -Infinity, balanceDueAtIssuance: 24032 } as any, "1.0")
    ).rejects.toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");

    // null
    await expect(
      generateInvoicePDF({ ...baseSnapshot, validPaidAtIssuance: null, balanceDueAtIssuance: 24032 } as any, "1.0")
    ).rejects.toThrow("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields");
  });
});

describe("formatCurrencyBDT centralized currency formatter", () => {
  it("should format known integer amounts with ৳ symbol and en-BD separators", () => {
    expect(formatCurrencyBDT(30040)).toBe("৳30,040");
    expect(formatCurrencyBDT(29990)).toBe("৳29,990");
    expect(formatCurrencyBDT(50)).toBe("৳50");
    expect(formatCurrencyBDT(6008)).toBe("৳6,008");
    expect(formatCurrencyBDT(1000000)).toBe("৳1,000,000");
  });

  it("should preserve legitimate zero values", () => {
    expect(formatCurrencyBDT(0)).toBe("৳0");
  });

  it("should format decimal amounts correctly when provided", () => {
    expect(formatCurrencyBDT(30040.5)).toBe("৳30,040.5");
    expect(formatCurrencyBDT(99.99)).toBe("৳99.99");
  });

  it("should fail safely on non-finite or invalid inputs rather than silently becoming zero", () => {
    expect(() => formatCurrencyBDT(NaN)).toThrow("Invalid monetary amount");
    expect(() => formatCurrencyBDT(Infinity)).toThrow("Invalid monetary amount");
    expect(() => formatCurrencyBDT(-Infinity)).toThrow("Invalid monetary amount");
    expect(() => formatCurrencyBDT(null as any)).toThrow("Invalid monetary amount");
    expect(() => formatCurrencyBDT(undefined as any)).toThrow("Invalid monetary amount");
    expect(() => formatCurrencyBDT("30040" as any)).toThrow("Invalid monetary amount");
  });
});

describe("PDFKit Unicode & TrueType Font Embedding Regression Tests", () => {
  it("should correctly render ৳ (U+09F3) and all monetary fields in an ADVANCE invoice without mojibake", async () => {
    const advanceSnapshot = buildInvoiceSnapshot(
      {
        ...mockOrder,
        total: 30040,
        subtotal: 29990,
        shippingCost: 50,
        discountAmount: 0,
        requiredAdvance: 6008,
      },
      mockSiteConfig,
      {
        invoiceType: "ADVANCE",
        referenceIdentity: "INV-RG-20261018-991567-1",
      }
    );

    const pdfBuffer = await generateInvoicePDF(advanceSnapshot, "1.0");
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);

    const { fullText, hasToUnicodeCMap, fontSubsets, hasMojibake } = extractPDFText(pdfBuffer);

    // 1. Font embedding assertions
    expect(hasToUnicodeCMap).toBe(true);
    expect(fontSubsets.some((f) => f.includes("HindSiliguri"))).toBe(true);

    // 2. Absence of corrupted characters
    expect(hasMojibake).toBe(false);
    expect(fullText).not.toContain("Ÿ");
    expect(fullText).not.toContain("Ý");
    expect(fullText).not.toContain("Ã");
    expect(fullText).not.toContain("\uFFFD"); // Replacement character 

    // 3. Exact monetary fields presence with ৳ (U+09F3)
    expect(fullText).toContain("৳29,990"); // Item total & Subtotal
    expect(fullText).toContain("৳50");     // Shipping cost
    expect(fullText).toContain("৳30,040"); // Total
    expect(fullText).toContain("৳6,008");  // Required Advance

    // 4. Customer and item metadata integrity
    expect(fullText).toContain("RootVana Sculpted Center Table");
    expect(fullText).toContain("Bilash");
    expect(fullText).toContain("RG-20261018-991567");
    expect(fullText).toContain("INV-RG-20261018-991567-1");
  });

  it("should correctly render zero-valued shipping and active discounts", async () => {
    const promoOrder = {
      ...mockOrder,
      subtotal: 30040,
      shippingCost: 0,      // Free shipping
      discountAmount: 500,  // Active promo
      total: 29540,
      requiredAdvance: 5908,
    };

    const snapshot = buildInvoiceSnapshot(promoOrder, mockSiteConfig, {
      invoiceType: "ADVANCE",
      referenceIdentity: "INV-RG-20261018-PROMO-1",
    });

    const pdfBuffer = await generateInvoicePDF(snapshot, "1.0");
    const { fullText, hasMojibake } = extractPDFText(pdfBuffer);

    expect(hasMojibake).toBe(false);
    expect(fullText).toContain("৳0");     // Zero shipping
    expect(fullText).toContain("-৳500");  // Formatted discount
    expect(fullText).toContain("৳29,540"); // Adjusted total
    expect(fullText).toContain("৳5,908"); // Adjusted required advance
  });

  it("should correctly render FINAL invoice with settlement fields and no mojibake", async () => {
    const finalSnapshot = buildInvoiceSnapshot(mockOrder, mockSiteConfig, {
      invoiceType: "FINAL",
      referenceIdentity: "FINV-RG-20261018-991567-1",
      validPaidAtIssuance: 6008,
      balanceDueAtIssuance: 24032,
    });

    const pdfBuffer = await generateInvoicePDF(finalSnapshot, "1.0");
    const { fullText, hasToUnicodeCMap, hasMojibake } = extractPDFText(pdfBuffer);

    expect(hasToUnicodeCMap).toBe(true);
    expect(hasMojibake).toBe(false);
    expect(fullText).toContain("FINAL INVOICE");
    expect(fullText).toContain("Valid Paid: ৳6,008");
    expect(fullText).toContain("Balance Due: ৳24,032");
    expect(fullText).toContain("৳30,040");
  });

  it("should correctly render PAYMENT RECEIPT with ৳ symbol and no mojibake", async () => {
    const receiptSnapshot = {
      branding: mockSiteConfig as any,
      referenceIdentity: "REC-RG-20261018-991567-1",
      linkedInvoiceReference: "INV-RG-20261018-991567-1",
      customerName: "Bilash",
      type: "ADVANCE",
      method: "bKash",
      amount: 6008,
      reference: "TRX-991567-BKASH",
      paidAt: "2026-10-18T10:00:00.000Z",
    };

    const pdfBuffer = await generateReceiptPDF(receiptSnapshot as any, "1.0");
    const { fullText, hasToUnicodeCMap, hasMojibake } = extractPDFText(pdfBuffer);

    expect(hasToUnicodeCMap).toBe(true);
    expect(hasMojibake).toBe(false);
    expect(fullText).toContain("PAYMENT RECEIPT");
    expect(fullText).toContain("৳6,008");
    expect(fullText).not.toContain("Tk 6008");
    expect(fullText).not.toContain("Ÿ");
    expect(fullText).not.toContain("Ã");
  });

  it("should fail safely when orderTotal or requiredAdvance are non-finite in ADVANCE invoice", async () => {
    const malformedOrder = {
      ...mockOrder,
      total: NaN,
    };
    const snapshot1 = buildInvoiceSnapshot(malformedOrder, mockSiteConfig);
    // Overwrite to simulate non-finite or corrupted snapshot
    (snapshot1 as any).orderTotal = NaN;
    await expect(generateInvoicePDF(snapshot1, "1.0")).rejects.toThrow("Invoice requires a finite numeric orderTotal");

    const snapshot2 = buildInvoiceSnapshot(mockOrder, mockSiteConfig);
    (snapshot2 as any).requiredAdvance = Infinity;
    await expect(generateInvoicePDF(snapshot2, "1.0")).rejects.toThrow("Advance invoice requires a finite numeric requiredAdvance");
  });
});


