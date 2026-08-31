"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/rbac";
import { PaymentService } from "@/services/payment.service";
import { revalidatePath } from "next/cache";

const reviseAdvanceSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  newRequiredAdvance: z.coerce
    .number()
    .int("Required advance must be a whole number")
    .min(0, "Required advance cannot be negative"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be 500 characters or fewer"),
  idempotencyKey: z.string().uuid("Invalid idempotency key"),
});

export type ReviseAdvanceActionState = {
  success: boolean;
  error?: string;
};

export async function reviseAdvanceAction(prevState: any, formData: FormData): Promise<ReviseAdvanceActionState> {
  try {
    // 1. Authenticate + RBAC
    await requirePermission("advance.revise");

    // 2. Parse & validate input
    const rawData = {
      orderId: formData.get("orderId")?.toString() || "",
      newRequiredAdvance: formData.get("newRequiredAdvance")?.toString() || "",
      reason: formData.get("reason")?.toString() || "",
      idempotencyKey: formData.get("idempotencyKey")?.toString() || "",
    };

    const validated = reviseAdvanceSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        error: Object.values(validated.error.flatten().fieldErrors).flat().join(", ") || "Validation failed",
      };
    }

    const { orderId, newRequiredAdvance, reason, idempotencyKey } = validated.data;

    // 3. Delegate to PaymentService (authoritative mutation boundary)
    await PaymentService.reviseAdvance({
      orderId,
      newRequiredAdvance,
      reason,
      idempotencyKey,
    });

    // 4. Revalidate
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");

    return { success: true };
  } catch (error: any) {
    if (error.name === "AppError") {
      return { success: false, error: error.message };
    }

    console.error("Revise Advance Server Action Error:", error);
    return { success: false, error: "An unexpected error occurred while revising the advance." };
  }
}
