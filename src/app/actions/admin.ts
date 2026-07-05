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

export async function updateOrderStatus(id: string, status: OrderStatus, advancePaidAmount?: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = { status };
    if (status === "CONFIRMED" && advancePaidAmount !== undefined) {
      updateData.advancePaid = advancePaidAmount;
      const order = await prisma.order.findUnique({ where: { id } });
      if (order) {
        updateData.balanceDue = order.total - advancePaidAmount;
      }
    }

    await prisma.order.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: "Database error" };
  }
}
