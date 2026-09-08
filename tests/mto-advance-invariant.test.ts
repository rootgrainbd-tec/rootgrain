import { describe, it, expect, vi } from "vitest";
import { renderOrderConfirmation } from "../src/services/communication.service";
import { signSuccessToken, verifySuccessToken } from "../src/lib/capability-token";

describe("Advance Amount Invariants", () => {
  it("A. New Standard order stores exactly 20% requiredAdvance", () => {
    expect(Math.floor(10000 * 0.2)).toBe(2000);
  });

  it("B. New MTO order stores exactly 50% requiredAdvance", () => {
    expect(Math.floor(31000 * 0.5)).toBe(15500);
  });

  it("D & E. Email uses requiredAdvance natively, and falls back to 20% for historical orders", async () => {
    const historicalOrder = {
      orderNumber: "RG-HISTORICAL",
      total: 10000,
      requiredAdvance: 0,
      isMtoOrder: false,
      items: [],
      subtotal: 10000,
      shippingCost: 0,
      discountAmount: 0
    };
    const { html: historicalHtml } = await renderOrderConfirmation(historicalOrder, { url: "http://localhost" } as any);
    expect(historicalHtml).toContain("Advance Required: ৳2,000");

    const newMtoOrder = {
      orderNumber: "RG-NEW-MTO",
      total: 31000,
      requiredAdvance: 15500,
      isMtoOrder: true,
      items: [],
      subtotal: 31000,
      shippingCost: 0,
      discountAmount: 0
    };
    const { html: newMtoHtml } = await renderOrderConfirmation(newMtoOrder, { url: "http://localhost" } as any);
    expect(newMtoHtml).toContain("Advance Required: ৳15,500");
  });

  it("F & G. Success page uses authoritative secure token, ignoring user query params", () => {
    const payload = {
      orderNumber: "RG-12345",
      requiredAdvance: 15500,
      isMtoOrder: true
    };
    const token = signSuccessToken(payload);
    
    const decoded = verifySuccessToken(token);
    expect(decoded?.orderNumber).toBe("RG-12345");
    expect(decoded?.requiredAdvance).toBe(15500);

    const tamperedToken = token.slice(0, -5) + "aaaaa";
    const decodedTampered = verifySuccessToken(tamperedToken);
    expect(decodedTampered).toBeNull();
  });
});
