import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as emailModule from "@/lib/email";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import { OrderService } from "@/services/order.service";
import { OrderRepository } from "@/repositories/order.repository";

// Mock resend
const sendEmailMock = vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null });
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: sendEmailMock,
      };
    },
  };
});

// Mock repositories and config
vi.mock("@/repositories/order.repository", () => ({
  OrderRepository: {
    getOrderById: vi.fn(),
    updateOrder: vi.fn(),
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/lib/site-config", () => ({
  getFreshSiteConfig: vi.fn().mockResolvedValue({
    name: "RootGrain",
    url: "https://rootgrain.bd",
    support: { email: "support@rootgrain.bd" }
  }),
}));

describe("Order Status Email Matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const generateOrder = (status: string) => ({
    id: "ord_123",
    orderNumber: "RG-TEST",
    status,
    total: 1000,
    shippingAddress: { email: "test@example.com", name: "Test User" },
    items: [],
  });

  describe("Status Transition -> Email Delivery", () => {
    let emailSpy: any;
    
    beforeEach(() => {
      emailSpy = vi.spyOn(emailModule, "sendOrderStatusUpdateEmail").mockResolvedValue(undefined);
    });

    afterEach(() => {
      emailSpy.mockRestore();
    });

    const statuses = [
      "CONFIRMED",
      "PROCESSING",
      "DISPATCHED",
      "DELIVERED",
      "REJECTED",
      "CANCELLED",
    ];

    it.each(statuses)("should send an email when status ACTUALLY changes to %s", async (newStatus) => {
      // Create a mock order with a DIFFERENT old status
      const oldStatus = newStatus === "PENDING_ADVANCE" ? "CONFIRMED" : "PENDING_ADVANCE";
      const oldOrder = generateOrder(oldStatus);
      const newOrder = generateOrder(newStatus);

      vi.mocked(OrderRepository.getOrderById).mockResolvedValueOnce(oldOrder as any);
      vi.mocked(OrderRepository.updateOrder).mockResolvedValueOnce(newOrder as any);

      await OrderService.updateOrderStatus("ord_123", newStatus as any);
      
      expect(emailSpy).toHaveBeenCalledTimes(1);
      expect(emailSpy).toHaveBeenCalledWith(newOrder, "test@example.com", newStatus);
    });

    it.each(statuses)("should NOT send an email when status DOES NOT change (%s -> %s)", async (status) => {
      const order = generateOrder(status);
      
      vi.mocked(OrderRepository.getOrderById).mockResolvedValueOnce(order as any);
      vi.mocked(OrderRepository.updateOrder).mockResolvedValueOnce(order as any);

      await OrderService.updateOrderStatus("ord_123", status as any);
      
      expect(emailSpy).not.toHaveBeenCalled();
    });
  });

  describe("Regression Safety: Existing Status Emails", () => {
    it("should retain existing template heading and wording for CONFIRMED", async () => {
      await sendOrderStatusUpdateEmail(generateOrder("CONFIRMED"), "test@example.com", "CONFIRMED");
      expect(sendEmailMock).toHaveBeenCalled();
      const html = sendEmailMock.mock.calls[0][0].html;
      expect(html).toContain("Order Confirmed!");
      expect(html).toContain("We have started production");
    });
    
    it("should retain existing template heading and wording for DISPATCHED", async () => {
      await sendOrderStatusUpdateEmail(generateOrder("DISPATCHED"), "test@example.com", "DISPATCHED");
      expect(sendEmailMock).toHaveBeenCalled();
      const html = sendEmailMock.mock.calls[0][0].html;
      expect(html).toContain("Order Dispatched!");
      expect(html).toContain("on its way to you");
    });

    it("should retain existing template heading and wording for DELIVERED", async () => {
      await sendOrderStatusUpdateEmail(generateOrder("DELIVERED"), "test@example.com", "DELIVERED");
      expect(sendEmailMock).toHaveBeenCalled();
      const html = sendEmailMock.mock.calls[0][0].html;
      expect(html).toContain("Order Delivered!");
      expect(html).toContain("Thank you for choosing us");
    });
  });
});
