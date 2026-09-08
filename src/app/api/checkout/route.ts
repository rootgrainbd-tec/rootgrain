import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckoutService } from "@/services/checkout.service";
import { checkoutPayloadSchema } from "@/validations/checkout.schema";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logger";
import { successResponse, handleAppError } from "@/lib/api-utils";
import { signSuccessToken } from "@/lib/capability-token";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // 1. Validate incoming payload
    const validationResult = checkoutPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn({ errors: validationResult.error.format() }, "Checkout validation failed");
      throw new AppError("Invalid request payload", 400);
    }

    const payload = validationResult.data;
    const userId = session?.user ? session.user.id : null;

    // 2. Process checkout via Service
    const { order } = await CheckoutService.processCheckout(payload, userId);

    const token = signSuccessToken({
      orderNumber: order.orderNumber,
      requiredAdvance: order.requiredAdvance,
      isMtoOrder: order.isMtoOrder
    });

    return successResponse({ orderId: order.id, orderNumber: order.orderNumber, token });
  } catch (error) {
    return handleAppError(error);
  }
}
