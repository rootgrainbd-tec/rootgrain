import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { handleAppError, successResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await AuthService.verifyEmail(data.token);
    return successResponse(null, result.message, { status: 200 });
  } catch (error) {
    logger.error({ err: error }, "Email verification error");
    return handleAppError(error);
  }
}
