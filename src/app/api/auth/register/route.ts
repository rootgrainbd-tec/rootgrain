import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { handleAppError, successResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const user = await AuthService.registerUser(data);
    return successResponse(user, "User created", { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Registration error");
    return handleAppError(error);
  }
}

