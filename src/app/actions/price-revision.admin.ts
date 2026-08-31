"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PaymentService } from "@/services/payment.service";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const priceRevisionSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(
    z.object({
      orderItemId: z.string().min(1),
      newUnitPrice: z.number().int().min(0)
    })
  ).min(1),
  reason: z.string().min(1),
  idempotencyKey: z.string().min(1)
});

export async function reviseOrderPriceAction(input: z.infer<typeof priceRevisionSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    // RBAC: strict permission check. No bypass.
    await requirePermission("price.revise");

    const validatedData = priceRevisionSchema.parse(input);

    // Trusted actor context
    const actor = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name
    };

    const result = await PaymentService.reviseOrderPrice(validatedData, actor);

    revalidatePath(`/admin/orders/${validatedData.orderId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("reviseOrderPriceAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}
