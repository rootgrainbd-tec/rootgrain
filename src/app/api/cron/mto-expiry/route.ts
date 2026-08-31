import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { MtoAdminService } from "@/services/mto-admin.service";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || cronSecret.trim() === "") {
    logger.error("CRON_SECRET is missing or empty. Configuration error.");
    return new NextResponse("Server Configuration Error", { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await MtoAdminService.expireOverdueOrders();
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error }, "MTO Expiry Cron Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
