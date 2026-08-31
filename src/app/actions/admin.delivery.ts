"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { Role } from "@prisma/client";
import { DeliveryAdminService } from "@/services/delivery-admin.service";

/**
 * Ensures the caller is an authenticated ADMIN.
 * Throws an error otherwise.
 */
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function markOrderDeliveredAction(orderId: string) {
  try {
    const actorId = await requireAdmin();
    await DeliveryAdminService.markDelivered(orderId, actorId);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId }, "Failed to mark order as delivered");
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}
