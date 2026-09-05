import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckoutService } from "@/services/checkout.service";
import { mtoCheckoutPayloadSchema } from "@/validations/mto-checkout.schema";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logger";
import { successResponse, handleAppError } from "@/lib/api-utils";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const requestId = uuidv4();
  const startTime = performance.now();
  
  logger.info({
    event: "MTO_DEBUG_START",
    requestId,
    timestamp: new Date().toISOString(),
  }, "Starting MTO checkout request");

  const diagnosticState = {
    stages: [] as { stage: string, elapsedMs: number }[],
    databaseEvidence: {
      orderCreated: false,
      orderId: null as string | null,
      orderNumber: null as string | null,
      idempotencyClaimed: false,
      idempotencyCompleted: false
    },
    commitBoundary: "BEFORE_TRANSACTION",
    inngestDispatchStarted: false,
    inngestDispatchCompleted: false,
    transactionCommitted: false,
    mark: function(stage: string) {
      this.stages.push({ stage, elapsedMs: Math.round(performance.now() - startTime) });
    }
  };

  let isDiagnosticRequest = false;

  try {
    diagnosticState.mark("S0_REQUEST_RECEIVED");

    const session = await getServerSession(authOptions);
    diagnosticState.mark("S2_SESSION_RESOLVED");
    
    const body = await request.json();

    // 1. Validate incoming payload
    const validationResult = mtoCheckoutPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn({ errors: validationResult.error.format() }, "MTO Checkout validation failed");
      throw new AppError("Invalid request payload", 400);
    }
    diagnosticState.mark("S1_PAYLOAD_VALIDATED");

    const payload = validationResult.data;
    const userId = session?.user ? session.user.id : null;
    isDiagnosticRequest = !!payload._diagnostic;

    // 2. Process checkout via Service
    const { order } = await CheckoutService.processMtoCheckout(payload, userId, isDiagnosticRequest ? diagnosticState : undefined);

    diagnosticState.mark("S17_RESPONSE");
    const duration = Math.round(performance.now() - startTime);
    logger.info({
      event: "MTO_DEBUG_SUCCESS",
      requestId,
      duration,
      timestamp: new Date().toISOString(),
    }, "Successfully processed MTO checkout");

    if (isDiagnosticRequest) {
      return Response.json({
        success: true,
        diagnostic: true,
        requestId,
        durationMs: duration,
        failedAt: null,
        error: null,
        stages: diagnosticState.stages,
        commitBoundary: diagnosticState.commitBoundary,
        transactionCommitted: diagnosticState.transactionCommitted,
        inngestDispatchStarted: diagnosticState.inngestDispatchStarted,
        inngestDispatchCompleted: diagnosticState.inngestDispatchCompleted,
        databaseEvidence: diagnosticState.databaseEvidence
      });
    }

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
    
    if (isDiagnosticRequest) {
      let errorClass = "UNEXPECTED_ERROR";
      let errorCode = error?.code || null;
      let safeMessage = error?.message || "Unknown error";
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        errorClass = "PRISMA_KNOWN_ERROR";
        errorCode = error.code;
        safeMessage = `Prisma error: ${error.code}`;
      } else if (error instanceof Prisma.PrismaClientInitializationError) {
        errorClass = "PRISMA_INIT_ERROR";
        errorCode = error.errorCode || "INIT_ERR";
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        errorClass = "PRISMA_VALIDATION_ERROR";
      } else if (error instanceof Prisma.PrismaClientRustPanicError) {
        errorClass = "PRISMA_RUST_PANIC";
      } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        errorClass = "PRISMA_UNKNOWN_ERROR";
      } else if (error.name === "AppError" || error.name === "ValidationError" || error.name === "NotFoundError") {
        errorClass = error.name;
        safeMessage = error.message;
      } else if (error.message?.includes("fetch") || error.message?.includes("ECONNREFUSED") || error.message?.includes("socket hang up")) {
        errorClass = "NETWORK_HTTP_ERROR";
      }
      
      if (diagnosticState.transactionCommitted && !diagnosticState.inngestDispatchCompleted && diagnosticState.inngestDispatchStarted) {
        errorClass = "AFTER_COMMIT_INNGEST_FAILURE";
      }

      return Response.json({
        success: false,
        diagnostic: true,
        requestId,
        durationMs: duration,
        failedAt: diagnosticState.stages[diagnosticState.stages.length - 1]?.stage || "UNKNOWN",
        error: {
          class: errorClass,
          code: errorCode,
          safeMessage
        },
        stages: diagnosticState.stages,
        commitBoundary: diagnosticState.commitBoundary,
        transactionCommitted: diagnosticState.transactionCommitted,
        inngestDispatchStarted: diagnosticState.inngestDispatchStarted,
        inngestDispatchCompleted: diagnosticState.inngestDispatchCompleted,
        databaseEvidence: diagnosticState.databaseEvidence
      }, { status: 500 });
    }

    return handleAppError(error);
  }
}
