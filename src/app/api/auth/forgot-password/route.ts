import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { handleAppError, successResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const result = await AuthService.initiatePasswordReset(email);
    return successResponse(result);
  } catch (error) {
    logger.error({ err: error }, "Forgot Password Error");
    return handleAppError(error);
  }
}

