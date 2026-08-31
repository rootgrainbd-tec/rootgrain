import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SteadfastShippingProvider } from "@/services/providers/shipping/steadfast.provider";
import { DeliveryService } from "@/services/delivery.service";
import { ShippingProviderResolver } from "@/services/providers/shipping/shipping-provider.resolver";
import { AppError, ValidationError } from "@/lib/errors/AppError";
import prisma from "@/lib/prisma";

// Mock prisma and OrderService
vi.mock("@/lib/prisma", () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => cb(prisma)),
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/services/order.service", () => ({
  OrderService: {
    updateOrderStatus: vi.fn(),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Phase 11 Slice 3 - Steadfast Provider & Integration", () => {
  const provider = new SteadfastShippingProvider();
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STEADFAST_API_KEY = "test_api_key";
    process.env.STEADFAST_SECRET_KEY = "test_secret_key";
  });

  afterEach(() => {
    delete process.env.STEADFAST_API_KEY;
    delete process.env.STEADFAST_SECRET_KEY;
  });

  const validRequest = {
    invoice: "ORD-123",
    codAmount: 1000,
    deliveryType: 0,
    recipient: {
      name: "Test",
      phone: "01712345678",
      street: "Road 1",
      district: "Dhaka",
      division: "Dhaka",
    }
  };

  describe("Provider Logic", () => {
    it("01. successful create should return tracking and FINALIZED", async () => {
      // Mock status pre-check to return 404 (safe to create)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Mock create order
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          consignment: { tracking_code: "TRACK123", status: "pending" }
        })
      });

      const result = await provider.createShipment(validRequest);
      expect(result.trackingReference).toBe("TRACK123");
      expect(result.normalizedStatus).toEqual({ type: "TRANSITION", targetState: "FINALIZED" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("02. existing shipment reconciliation (idempotency)", async () => {
      // Mock status pre-check to return existing shipment
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          delivery_status: "delivered",
          tracking_code: "TRACK456"
        })
      });

      const result = await provider.createShipment(validRequest);
      expect(result.trackingReference).toBe("TRACK456");
      expect(result.normalizedStatus).toEqual({ type: "TRANSITION", targetState: "DELIVERED" });
      // Should NOT call create endpoint
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("03/24. timeout reconciliation", async () => {
      // Mock status pre-check 404
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      
      // Mock timeout error
      const abortError = new Error("Abort");
      abortError.name = "AbortError";
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(provider.createShipment(validRequest))
        .rejects.toThrow("Provider timeout (UNKNOWN OUTCOME)");
    });

    it("05/29. duplicate invoice / 400 recovery", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      
      // Create order returns 400 with duplicate msg
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invoice already exists" })
      });

      // Recovery call returns shipment
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          delivery_status: "pending",
          tracking_code: "TRACK789"
        })
      });

      const result = await provider.createShipment(validRequest);
      expect(result.trackingReference).toBe("TRACK789");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("08. 404 not found on sync throws AppError", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(provider.getShipmentStatus("UNKNOWN"))
        .rejects.toThrow("Shipment not found");
    });

    it("23. PRIVATE_FREIGHT firewall", () => {
      const resolved = ShippingProviderResolver.resolve("PRIVATE_FREIGHT");
      expect(resolved).toBeNull();
    });

    it("18/19. cancelled mapping", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({ delivery_status: "cancelled", tracking_code: "123" })
      });
      const result = await provider.getShipmentStatus("ORD");
      expect(result.normalizedStatus).toEqual({ type: "CANCEL_ORDER", providerRawStatus: "cancelled" });
    });
  });

  describe("DeliveryService Integration", () => {
    it("creates shipment, updates tracking, and transitions state", async () => {
      vi.spyOn(provider, "createShipment").mockResolvedValueOnce({
        trackingReference: "TRACK-SVC",
        normalizedStatus: { type: "TRANSITION", targetState: "FINALIZED" }
      });
      
      vi.spyOn(ShippingProviderResolver, "resolve").mockReturnValueOnce(provider);

      const mockOrder = {
        id: "id-123",
        orderNumber: "ORD-123",
        deliveryState: "TBD",
        logistics: "STEADFAST",
        balanceDue: 1000,
        shippingAddress: { name: "A", phone: "01700000000", street: "S", district: "D", division: "D" }
      };

      (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);
      
      // Mock transitionState
      const transitionSpy = vi.spyOn(DeliveryService, "transitionState").mockResolvedValueOnce({ success: true, orderId: "id-123", idempotent: false });

      const result = await DeliveryService.createShipment("id-123", "actor-1", ["delivery.manage"]);

      expect(result.success).toBe(true);
      expect(result.trackingReference).toBe("TRACK-SVC");
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "id-123" },
        data: { trackingNumber: "TRACK-SVC" }
      });
      expect(transitionSpy).toHaveBeenCalledWith("id-123", "FINALIZED", "actor-1", ["delivery.manage"]);
    });

    it("aborts creation for DELIVERED order", async () => {
      const mockOrder = { deliveryState: "DELIVERED" };
      (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);
      await expect(DeliveryService.createShipment("id-123", "actor", ["delivery.manage"]))
        .rejects.toThrow("Cannot create shipment for DELIVERED order");
    });

    it("skips integration for MANUAL provider", async () => {
      const mockOrder = { logistics: "PRIVATE_FREIGHT" };
      (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);
      
      const result = await DeliveryService.createShipment("id-123", "actor", ["delivery.manage"]);
      expect(result.message).toContain("Manual delivery selected");
    });
  });
});
