import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckoutService } from "@/services/checkout.service";
import { mtoCheckoutPayloadSchema } from "@/validations/mto-checkout.schema";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logger";
import { successResponse, handleAppError } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // 1. Validate incoming payload
    const validationResult = mtoCheckoutPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn({ errors: validationResult.error.format() }, "MTO Checkout validation failed");
      throw new AppError("Invalid request payload", 400);
    }

    const payload = validationResult.data;
    const userId = session?.user ? session.user.id : null;

    // 2. Process checkout via Service
    const { order } = await CheckoutService.processMtoCheckout(payload, userId);

    return successResponse({ orderId: order.id, orderNumber: order.orderNumber });
  } catch (error) {
    return handleAppError(error);
  }
}
