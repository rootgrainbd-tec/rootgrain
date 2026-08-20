"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { PaymentMethod, PaymentType } from "@prisma/client";
import { PaymentService } from "@/services/payment.service";
import { revalidatePath } from "next/cache";

const adminPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  amount: z.number().int("Amount must be an integer").positive("Amount must be positive"),
  type: z.nativeEnum(PaymentType),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  idempotencyKey: z.string().uuid("Invalid idempotency key"),
}).superRefine((data, ctx) => {
  // 0019 Payment Matrix Validation
  if (data.type === "ADVANCE" && data.method === "COD") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ADVANCE payment cannot use COD method",
      path: ["method"],
    });
  }
  
  if (data.type === "INSTALLMENT" && data.method === "COD") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "INSTALLMENT payment cannot use COD method",
      path: ["method"],
    });
  }

  if (data.type === "COD" && !(data.method === "COD" || data.method === "CASH")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "COD payment type must use COD or CASH method",
      path: ["method"],
    });
  }

  // Digital Reference Validation
  const isDigital = data.method === "MANUAL_BKASH" || data.method === "BANK_TRANSFER";
  const refTrimmed = data.reference?.trim();
  
  if (isDigital && !refTrimmed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Reference is required for digital payments (bKash/Bank)",
      path: ["reference"],
    });
  }
});

export type ActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function recordAdminPaymentAction(prevState: any, formData: FormData): Promise<ActionState> {
  try {
    // 1. Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin role required." };
    }

    // 2. Parse & Validate Input
    const rawAmount = formData.get("amount");
    const amount = rawAmount ? parseInt(rawAmount.toString(), 10) : 0;
    
    const rawData = {
      orderId: formData.get("orderId")?.toString() || "",
      amount,
      type: formData.get("type")?.toString() as PaymentType,
      method: formData.get("method")?.toString() as PaymentMethod,
      reference: formData.get("reference")?.toString() || undefined,
      idempotencyKey: formData.get("idempotencyKey")?.toString() || "",
    };

    const validated = adminPaymentSchema.safeParse(rawData);

    if (!validated.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        fieldErrors: validated.error.flatten().fieldErrors 
      };
    }

    const { orderId, amount: validAmount, type, method, reference, idempotencyKey } = validated.data;
    
    // Normalize reference
    const normalizedReference = reference?.trim() || undefined;

    // 3. Delegate to PaymentService (Authoritative backend mutation boundary)
    // We intentionally ignore any client-supplied balance or identities.
    await PaymentService.recordPayment({
      orderId,
      amount: validAmount,
      type,
      method,
      reference: normalizedReference,
      idempotencyKey,
    });

    // 4. Revalidate
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error: any) {
    // Safe error surfacing. Assuming AppError exposes .message safely.
    // If not, we surface a generic error for unknown failures.
    if (error.name === "AppError") {
      return { success: false, error: error.message };
    }
    
    // Do not leak SQL or Prisma errors.
    console.error("Admin Payment Server Action Error:", error);
    return { success: false, error: "An unexpected error occurred while processing the payment." };
  }
}
