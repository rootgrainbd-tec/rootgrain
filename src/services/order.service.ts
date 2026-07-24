import "server-only";
import { OrderRepository } from "@/repositories/order.repository";
import { AppError, ValidationError, NotFoundError } from "@/lib/errors/AppError";
import { OrderStatus, Prisma } from "@prisma/client";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export class OrderService {
  static async getOrderDetails(orderNumber: string, email?: string, userId?: string) {
    if (!orderNumber) {
      throw new AppError("Missing order number", 400);
    }

    const order = await OrderRepository.getOrderByNumber(orderNumber);

    // Enumeration resistance: treat not found or unauthorized as the same generic 401 error
    if (!order) {
      throw new AppError("Order not found or unauthorized access", 401);
    }

    let isAuthorized = false;

    // Condition 1: Authenticated owner
    if (userId && order.userId === userId) {
      isAuthorized = true;
    }

    // Condition 2: Guest verifier (email)
    if (!isAuthorized && email) {
      const shippingEmail = (order.shippingAddress as any)?.email;
      
      const normalizedInputEmail = email.trim().toLowerCase();
      
      if (shippingEmail && shippingEmail.trim().toLowerCase() === normalizedInputEmail) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new AppError("Order not found or unauthorized access", 401);
    }

    return order;
  }

  static async updateOrderStatus(id: string, status: OrderStatus, advancePaidAmount?: number) {
    if (!id || !status) {
      throw new ValidationError("Missing order ID or status");
    }

    const currentOrder = await OrderRepository.getOrderById(id);
    if (!currentOrder) {
      throw new NotFoundError("Order not found");
    }

    // Status Validation (Basic progression checks if we wanted to enforce strictly, but for now we trust admin UI)
    // The prompt: "Prevent invalid transitions if such rules already exist."
    // No strict transition map existed in admin.ts previously, but we handle advance paid logically here:

    const updateData: Prisma.OrderUpdateInput = { status };

    if (status === "CONFIRMED" && advancePaidAmount !== undefined) {
      updateData.advancePaid = advancePaidAmount;
      updateData.balanceDue = currentOrder.total - advancePaidAmount;
    }

    const updatedOrder = await OrderRepository.updateOrder(id, updateData);

    // Send email notification for status change
    const email = (updatedOrder.shippingAddress as any)?.email;
    if (email && ["CONFIRMED", "DISPATCHED", "DELIVERED"].includes(status)) {
      sendOrderStatusUpdateEmail(updatedOrder, email, status).catch((error) => {
        // Just log the error, don't fail the order update
        console.error("Failed to send order status update email", error);
      });
    }

    return updatedOrder;
  }
}
