"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateInquiryStatus(id: string, status: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.inquiry.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/admin/inquiries");
    return { success: true };
  } catch (error) {
    console.error("Failed to update inquiry status:", error);
    return { success: false, error: "Database error" };
  }
}

import { OrderStatus } from "@prisma/client";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export async function updateOrderStatus(id: string, status: OrderStatus, advancePaidAmount?: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = { status };
    let currentOrder = null;
    
    if (status === "CONFIRMED" && advancePaidAmount !== undefined) {
      updateData.advancePaid = advancePaidAmount;
      currentOrder = await prisma.order.findUnique({ where: { id } });
      if (currentOrder) {
        updateData.balanceDue = currentOrder.total - advancePaidAmount;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true }
    });

    // Send email notification for status change
    const email = (updatedOrder.shippingAddress as any)?.email;
    if (email && ["CONFIRMED", "DISPATCHED", "DELIVERED"].includes(status)) {
      sendOrderStatusUpdateEmail(updatedOrder, email, status).catch(console.error);
    }

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: "Database error" };
  }
}

export async function updateStoreSettings(delayHours: number, discountPercent: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await prisma.storeSettings.findFirst();
    if (existing) {
      await prisma.storeSettings.update({
        where: { id: existing.id },
        data: {
          abandonedCartDelayHours: delayHours,
          abandonedCartDiscountPercent: discountPercent
        }
      });
    } else {
      await prisma.storeSettings.create({
        data: {
          abandonedCartDelayHours: delayHours,
          abandonedCartDiscountPercent: discountPercent
        }
      });
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Database error" };
  }
}
