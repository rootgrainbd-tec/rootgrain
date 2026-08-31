import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/pdfGenerator";
import { getStorageAdapter } from "@/lib/infrastructure/storage";
import prisma from "@/lib/prisma";

vi.mock("@/inngest/client", () => {
  return {
    inngest: {
      send: vi.fn(),
      createFunction: vi.fn((config, handler) => ({ config, handler })),
    }
  };
});

// Import after mocking inngest!
import { generateDocument } from "@/inngest/functions/generateDocument";

vi.mock("@/lib/pdfGenerator", () => ({
  generateInvoicePDF: vi.fn(),
  generateReceiptPDF: vi.fn(),
}));

vi.mock("@/lib/infrastructure/storage", () => ({
  getStorageAdapter: vi.fn(() => ({
    upload: vi.fn(),
  }))
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    orderDocument: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    order: {
      update: vi.fn()
    }
  }
}));

describe("Failure Injection", () => {
  const handler = (generateDocument as any).handler;
  const stepMock = {
    run: async (name: string, cb: any) => cb()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("A. PDF generation failure propagates", async () => {
    (prisma.orderDocument.findUnique as any).mockResolvedValue({ id: "doc-1", orderId: "ord-1", snapshot: {} });
    (generateInvoicePDF as any).mockRejectedValue(new Error("PDF_RENDER_FAIL"));

    await expect(handler({
      event: { data: { orderDocumentId: "doc-1", documentType: "INVOICE" } },
      step: stepMock
    })).rejects.toThrow("PDF_RENDER_FAIL");
  });

  it("B. Blob upload failure propagates", async () => {
    (prisma.orderDocument.findUnique as any).mockResolvedValue({ id: "doc-1", orderId: "ord-1", snapshot: {} });
    (generateInvoicePDF as any).mockResolvedValue(Buffer.from("pdf"));
    
    const mockStorage = { upload: vi.fn().mockRejectedValue(new Error("BLOB_UPLOAD_FAIL")) };
    (getStorageAdapter as any).mockReturnValue(mockStorage);

    await expect(handler({
      event: { data: { orderDocumentId: "doc-1", documentType: "INVOICE" } },
      step: stepMock
    })).rejects.toThrow("BLOB_UPLOAD_FAIL");
  });

  it("C. DB update failure propagates", async () => {
    (prisma.orderDocument.findUnique as any).mockResolvedValue({ id: "doc-1", orderId: "ord-1", snapshot: {} });
    (generateInvoicePDF as any).mockResolvedValue(Buffer.from("pdf"));
    
    const mockStorage = { upload: vi.fn().mockResolvedValue("url") };
    (getStorageAdapter as any).mockReturnValue(mockStorage);

    (prisma.orderDocument.updateMany as any).mockRejectedValue(new Error("DB_TIMEOUT"));

    await expect(handler({
      event: { data: { orderDocumentId: "doc-1", documentType: "INVOICE" } },
      step: stepMock
    })).rejects.toThrow("DB_TIMEOUT");
  });
});
