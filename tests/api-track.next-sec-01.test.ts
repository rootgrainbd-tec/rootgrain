import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../src/app/api/track/route";
import { OrderService } from "../src/services/order.service";
import { AppError } from "../src/lib/errors/AppError";

// Mock OrderService
vi.mock("../src/services/order.service", () => ({
  OrderService: {
    getOrderDetails: vi.fn()
  }
}));

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue(null)
}));

function createRequest(body: any, method = "POST") {
  return new Request("http://localhost/api/track", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
}

describe("POST /api/track API Boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("safely handles malformed JSON", async () => {
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{" // malformed JSON
    });
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(400);
    expect(data.error.message).toBe("Invalid JSON body");
  });

  it("denies requests without required fields", async () => {
    vi.mocked(OrderService.getOrderDetails).mockRejectedValue(new AppError("Missing order number", 400));
    
    const req = createRequest({ email: "test@example.com" });
    const res = await POST(req);
    
    expect(res.status).toBe(400); 
  });

  it("strips PII and minimizes response for valid request", async () => {
    vi.mocked(OrderService.getOrderDetails).mockResolvedValue({
      id: "ord_1",
      orderNumber: "RG-123",
      createdAt: new Date("2026-07-20T00:00:00Z"),
      status: "PENDING_ADVANCE",
      total: 1500,
      userId: "user_999",
      shippingAddress: { email: "test@example.com", phone: "12345" },
      items: [
        { id: "item_1", productId: "prod_1", quantity: 1, unitPrice: 1500, productName: "Table" }
      ]
    } as any);

    const req = createRequest({ orderNumber: "RG-123", email: "test@example.com" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    
    const order = data.data.order;
    // Check included fields
    expect(order.orderNumber).toBe("RG-123");
    expect(order.total).toBe(1500);
    expect(order.items[0].price).toBe(1500);
    
    // Check EXCLUDED fields (PII minimization)
    expect(order.shippingAddress).toBeUndefined();
    expect(order.userId).toBeUndefined();
  });
});
