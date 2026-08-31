"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/rbac";
import { PaymentService } from "@/services/payment.service";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

const voidPaymentSchema = z.object({
  paymentRecordId: z.string().min(1, "Payment record ID is required"),
  idempotencyKey: z.string().uuid("Invalid idempotency key"),
});

export type VoidActionState = {
  success: boolean;
  error?: string;
};

export async function voidPaymentAction(prevState: any, formData: FormData): Promise<VoidActionState> {
  try {
    // 1. Authenticate + RBAC
    await requirePermission("payment.void");

    // 2. Parse & Validate Input (only paymentRecordId and idempotencyKey)
    const rawData = {
      paymentRecordId: formData.get("paymentRecordId")?.toString() || "",
      idempotencyKey: formData.get("idempotencyKey")?.toString() || "",
    };

    const validated = voidPaymentSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.flatten().fieldErrors
          ? Object.values(validated.error.flatten().fieldErrors).flat().join(", ")
          : "Validation failed",
      };
    }

    const { paymentRecordId, idempotencyKey } = validated.data;

    // 3. Resolve orderId server-side for revalidation path (before mutation)
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id: paymentRecordId },
      select: { orderId: true }
    });

    if (!paymentRecord) {
      return { success: false, error: "Payment record not found." };
    }

    // 4. Delegate to PaymentService (authoritative mutation boundary)
    await PaymentService.voidPayment({
      paymentRecordId,
      idempotencyKey,
    });

    // 5. Revalidate
    revalidatePath(`/admin/orders/${paymentRecord.orderId}`);

    return { success: true };
  } catch (error: any) {
    if (error.name === "AppError") {
      return { success: false, error: error.message };
    }

    console.error("Void Payment Server Action Error:", error);
    return { success: false, error: "An unexpected error occurred while voiding the payment." };
  }
}
