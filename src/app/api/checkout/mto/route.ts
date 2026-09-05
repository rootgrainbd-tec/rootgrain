import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckoutService } from "@/services/checkout.service";
import { mtoCheckoutPayloadSchema } from "@/validations/mto-checkout.schema";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logger";
import { successResponse, handleAppError } from "@/lib/api-utils";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const requestId = uuidv4();
  const startTime = performance.now();
  
  logger.info({
    event: "MTO_DEBUG_START",
    requestId,
    timestamp: new Date().toISOString(),
  }, "Starting MTO checkout request");

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

    const duration = Math.round(performance.now() - startTime);
    logger.info({
      event: "MTO_DEBUG_SUCCESS",
      requestId,
      duration,
      timestamp: new Date().toISOString(),
    }, "Successfully processed MTO checkout");

    return successResponse({ orderId: order.id, orderNumber: order.orderNumber });
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.error({
      event: "MTO_DEBUG_ERROR",
      requestId,
      duration,
      timestamp: new Date().toISOString(),
      errorName: error?.name,
      errorCode: error?.code,
      safeErrorMessage: error?.message,
    }, "Failed to process MTO checkout");
    
    return handleAppError(error);
  }
}
