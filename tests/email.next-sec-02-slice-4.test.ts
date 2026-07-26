import { describe, it, expect, vi, beforeEach } from "vitest";
import nodemailer from "nodemailer";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Mock nodemailer
vi.mock("nodemailer", () => {
  const sendMailMock = vi.fn();
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: sendMailMock,
      }),
    },
  };
});

// Mock pdfGenerator
vi.mock("@/lib/pdfGenerator", () => ({
  generateInvoicePDF: vi.fn().mockResolvedValue(Buffer.from("pdf")),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("NEXT-SEC-02 Slice 4: Capability Token Email Delivery", () => {
  const mockSendMail = (nodemailer.createTransport() as any).sendMail;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://test.rootgrain.bd";
  });

  it("should generate tracking link with capability token in URL fragment for new guest orders", async () => {
    const order = {
      orderNumber: "RG-12345",
      subtotal: 1000,
      shippingCost: 100,
      total: 1100,
      discountAmount: 0,
      items: [],
      userId: null, // Guest
    };

    const rawToken = "super-secret-raw-token-123";
    await sendOrderConfirmationEmail(order, "guest@example.com", rawToken);

    expect(mockSendMail).toHaveBeenCalled();
    const callArgs = mockSendMail.mock.calls[0][0];
    const html = callArgs.html;

    // Verify correct fragment format
    expect(html).toContain('href="https://test.rootgrain.bd/track?orderNumber=RG-12345#token=super-secret-raw-token-123"');
    expect(html).not.toContain("guestTokenHash"); // Hash must never be exposed
  });

  it("should generate legacy tracking link without token for old guest orders", async () => {
    const order = {
      orderNumber: "RG-LEGACY",
      subtotal: 1000,
      shippingCost: 100,
      total: 1100,
      discountAmount: 0,
      items: [],
      userId: null, // Guest
    };

    // No raw token provided
    await sendOrderConfirmationEmail(order, "legacy@example.com");

    expect(mockSendMail).toHaveBeenCalled();
    const callArgs = mockSendMail.mock.calls[0][0];
    const html = callArgs.html;

    // Verify it uses legacy format without #token
    expect(html).toContain('href="https://test.rootgrain.bd/track?orderNumber=RG-LEGACY"');
    expect(html).not.toContain("#token=");
  });

  it("should NOT generate any tracking link for authenticated users", async () => {
    const order = {
      orderNumber: "RG-AUTH",
      subtotal: 1000,
      shippingCost: 100,
      total: 1100,
      discountAmount: 0,
      items: [],
      userId: "usr_12345", // Authenticated
    };

    await sendOrderConfirmationEmail(order, "auth@example.com", "should-not-exist");

    expect(mockSendMail).toHaveBeenCalled();
    const callArgs = mockSendMail.mock.calls[0][0];
    const html = callArgs.html;

    // Verify no tracking link is provided at all, since they track via their account dashboard
    expect(html).not.toContain('href="https://test.rootgrain.bd/track');
  });
});
