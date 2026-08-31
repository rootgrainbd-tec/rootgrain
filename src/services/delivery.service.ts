import "server-only";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors/AppError";
import { appendOrderEvent } from "@/lib/persistence/orderEvent";
import { DeliveryState, LogisticsProvider } from "@prisma/client";
import { ShippingProviderResolver } from "./providers/shipping/shipping-provider.resolver";
import { CreateShipmentRequest, NormalizedProviderStatus } from "./providers/shipping/shipping-provider.interface";
import { OrderService } from "./order.service";

export class DeliveryService {
  /**
   * Validates and executes a DeliveryState transition.
   * Ensures that physical logistics states follow a linear forward progression.
   */
  static async transitionState(
    orderId: string,
    targetState: DeliveryState,
    actorId: string,
    permissions: string[]
  ) {
    if (!permissions.includes("delivery.manage")) {
      throw new AppError("Unauthorized: missing delivery.manage", 403);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Lock the order row
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      const currentState = order.deliveryState as DeliveryState;

      // 2. Idempotency Check (same state)
      if (currentState === targetState) {
        return { success: true, orderId: order.id, idempotent: true };
      }

      // 3. State Machine Validation
      const validTransitions: Record<DeliveryState, DeliveryState[]> = {
        TBD: ["FINALIZED"],
        FINALIZED: ["OUT_FOR_DELIVERY"],
        OUT_FOR_DELIVERY: ["DELIVERED"],
        DELIVERED: [] // terminal
      };

      if (!validTransitions[currentState].includes(targetState)) {
        throw new AppError(`Invalid transition from ${currentState} to ${targetState}`, 400);
      }

      // 4. Perform Update (Financials explicitly untouched)
      await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryState: targetState
        }
      });

      // 5. Emit Domain Event
      await appendOrderEvent(
        tx,
        orderId,
        "DELIVERY_STATE_TRANSITIONED",
        {
          previousState: currentState,
          newState: targetState
        },
        { id: actorId, type: "ADMIN" }
      );

      return { success: true, orderId: order.id, idempotent: false };
    });
  }

  /**
   * Sets the delivery method (e.g. MANUAL mapped to PRIVATE_FREIGHT, or STEADFAST).
   * Ensures method switching is only allowed under permitted conditions.
   * Method selection DOES NOT mutate DeliveryState.
   */
  static async setDeliveryMethod(
    orderId: string,
    targetMethod: LogisticsProvider,
    actorId: string,
    permissions: string[]
  ) {
    if (!permissions.includes("delivery.manage")) {
      throw new AppError("Unauthorized: missing delivery.manage", 403);
    }

    return await prisma.$transaction(async (tx) => {
      const orders = await tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!orders || orders.length === 0) throw new AppError("Order not found", 404);
      const order = orders[0];

      const currentMethod = order.logistics as LogisticsProvider;
      const deliveryState = order.deliveryState as DeliveryState;

      if (currentMethod === targetMethod) {
        return { success: true, orderId: order.id, idempotent: true };
      }

      if (deliveryState === "DELIVERED") {
        throw new AppError("Cannot change delivery method after order is DELIVERED", 400);
      }

      if (deliveryState !== "TBD") {
        // Conditionally allowed in FINALIZED pending business decision, so throw error for now
        throw new AppError("Cannot switch delivery method after TBD without business decision override", 400);
      }

      // Do NOT call provider, DO NOT mutate state. Merely store the selected method.
      await tx.order.update({
        where: { id: orderId },
        data: {
          logistics: targetMethod
        }
      });

      // Optional: Emit DELIVERY_METHOD_CHANGED event if required in the future.
      // (Omitted per "Do NOT automatically introduce DELIVERY_METHOD_CHANGED unless explicitly required")

      return { success: true, orderId: order.id, idempotent: false };
    });
  }

  /**
   * Processes a normalized status returned from a provider.
   */
  private static async processNormalizedStatus(
    orderId: string,
    status: NormalizedProviderStatus,
    actorId: string,
    permissions: string[]
  ) {
    if (status.type === "TRANSITION") {
      await this.transitionState(orderId, status.targetState, actorId, permissions);
    } else if (status.type === "CANCEL_ORDER") {
      await OrderService.updateOrderStatus(orderId, "CANCELLED");
    } else if (status.type === "PROVIDER_ONLY") {
      // Log for ADMIN_REVIEW, no state mutation
      console.log(`[Provider Sync] orderId=${orderId} Provider-only status: ${status.providerRawStatus}`);
    }
  }

  /**
   * Syncs the existing shipment status from the provider and updates domain states.
   */
  static async syncShipmentStatus(
    orderId: string,
    actorId: string,
    permissions: string[]
  ) {
    if (!permissions.includes("delivery.manage")) {
      throw new AppError("Unauthorized: missing delivery.manage", 403);
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("Order not found", 404);

    const provider = ShippingProviderResolver.resolve(order.logistics);
    if (!provider) {
      return { success: true, message: "Manual delivery selected, no provider sync" };
    }

    // Call provider outside transaction
    const result = await provider.getShipmentStatus(order.orderNumber);

    // Update tracking number if needed
    if (order.trackingNumber !== result.trackingReference) {
      await prisma.order.update({
        where: { id: orderId },
        data: { trackingNumber: result.trackingReference }
      });
    }

    await this.processNormalizedStatus(orderId, result.normalizedStatus, actorId, permissions);

    return { success: true, trackingReference: result.trackingReference };
  }

  /**
   * Creates a shipment via the assigned provider.
   */
  static async createShipment(
    orderId: string,
    actorId: string,
    permissions: string[]
  ) {
    if (!permissions.includes("delivery.manage")) {
      throw new AppError("Unauthorized: missing delivery.manage", 403);
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("Order not found", 404);

    if (order.deliveryState === "DELIVERED") {
      throw new AppError("Cannot create shipment for DELIVERED order", 400);
    }

    const provider = ShippingProviderResolver.resolve(order.logistics);
    if (!provider) {
      return { success: true, message: "Manual delivery selected, no provider integration" };
    }

    const address = order.shippingAddress as any;
    const request: CreateShipmentRequest = {
      invoice: order.orderNumber,
      codAmount: order.balanceDue,
      deliveryType: 0,
      recipient: {
        name: address?.name || "Customer",
        phone: address?.phone || "00000000000",
        street: address?.street || "",
        district: address?.district || "",
        division: address?.division || "",
        email: address?.email || undefined,
      },
      note: order.notes || undefined,
    };

    // External HTTP call outside Prisma transaction
    const result = await provider.createShipment(request);

    // Persist local tracking reference
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: result.trackingReference
      }
    });

    await this.processNormalizedStatus(orderId, result.normalizedStatus, actorId, permissions);

    return { success: true, trackingReference: result.trackingReference };
  }
}
