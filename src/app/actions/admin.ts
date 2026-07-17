"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { InquiryService } from "@/services/inquiry.service";
import { logger } from "@/lib/logger";
import { OrderStatus, Role } from "@prisma/client";
import { OrderService } from "@/services/order.service";
import { adminService } from "@/services/admin.service";

export async function updateInquiryStatus(id: string, status: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    await InquiryService.updateInquiryStatus(id, status);

    revalidatePath("/admin/inquiries");
    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to update inquiry status");
    return { success: false, error: "Database error" };
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus, advancePaidAmount?: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    await OrderService.updateOrderStatus(id, status, advancePaidAmount);

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to update order status");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function updateStoreSettings(delayHours: number, discountPercent: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    await adminService.updateStoreSettings(delayHours, discountPercent);

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to update settings");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function toggleMaintenanceMode(status: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    await adminService.toggleMaintenanceMode(status);

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to toggle maintenance mode");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}
