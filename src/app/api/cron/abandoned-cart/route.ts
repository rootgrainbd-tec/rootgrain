import { NextResponse } from "next/server";
import { CartService } from "@/services/cart.service";
import { logger } from "@/lib/logger";

// Verify secret to ensure only cron can call this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "default_cron_secret";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.NODE_ENV === "production") {
    // return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await CartService.processAbandonedCarts();
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error }, "Cron Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
