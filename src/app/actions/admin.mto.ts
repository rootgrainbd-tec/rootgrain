"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { Role } from "@prisma/client";
import { MtoAdminService } from "@/services/mto-admin.service";

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

export async function confirmMtoOrder(orderId: string) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.confirmMtoOrder(orderId, actorId);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId }, "Failed to confirm MTO order");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function updateRequiredAdvance(orderId: string, amount: number) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.updateRequiredAdvance(orderId, amount, actorId);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId, amount }, "Failed to update required advance");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function updateShippingAddress(orderId: string, newAddress: any) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.updateShippingAddress(orderId, newAddress, actorId);
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId }, "Failed to update shipping address");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function addInternalNoteAction(orderId: string, content: string) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.addInternalNote(orderId, content, actorId);
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId }, "Failed to add internal note");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function updateInternalNoteAction(noteId: string, content: string, orderId: string) {
  try {
    await requireAdmin();
    await MtoAdminService.updateInternalNote(noteId, content);
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, noteId }, "Failed to update internal note");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function deleteInternalNoteAction(noteId: string, orderId: string) {
  try {
    await requireAdmin();
    await MtoAdminService.deleteInternalNote(noteId);
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, noteId }, "Failed to delete internal note");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function markMtoExpired(orderId: string) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.markExpired(orderId, actorId);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId }, "Failed to mark MTO order as expired");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function startMtoProduction(orderId: string) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.startProduction(orderId, actorId);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId }, "Failed to start production for MTO order");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function completeMtoProduction(orderId: string) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.completeProduction(orderId, actorId);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId }, "Failed to complete production for MTO order");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function voidInvoiceAction(invoiceId: string, orderId: string) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.voidInvoice(invoiceId, actorId);
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, invoiceId, orderId }, "Failed to void invoice");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}

export async function dispatchOrderAction(orderId: string, trackingNumber?: string, trackingUrl?: string, notes?: string) {
  try {
    const actorId = await requireAdmin();
    await MtoAdminService.dispatchOrder(orderId, actorId, trackingNumber, trackingUrl, notes);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, orderId }, "Failed to dispatch order");
    const message = error instanceof Error ? error.message : "Database error";
    return { success: false, error: message };
  }
}
