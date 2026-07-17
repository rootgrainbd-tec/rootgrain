import "server-only";
import { OrderRepository } from "@/repositories/order.repository";
import { AppError, ValidationError, NotFoundError } from "@/lib/errors/AppError";
import { OrderStatus, Prisma } from "@prisma/client";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export class OrderService {
  static async getOrderDetails(orderNumber: string) {
    if (!orderNumber) {
      throw new AppError("Missing order number", 400);
    }

    const order = await OrderRepository.getOrderByNumber(orderNumber);

    if (!order) {
      throw new AppError("Order not found", 404);
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
