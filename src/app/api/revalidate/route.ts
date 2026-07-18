import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SyncService } from "../../../services/sync.service";
import { logger } from "../../../lib/logger";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Check Authorization header for Bearer token
    if (authHeader !== `Bearer ${process.env.SANITY_WEBHOOK_SECRET}`) {
      logger.warn("Invalid webhook secret attempted for revalidation");
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    const body = await req.json();
    const { _type, slug } = body;

    // Based on the document type that was updated, revalidate relevant pages
    if (_type === "product") {
      revalidatePath("/collection");
      revalidatePath("/");
      if (slug?.current) {
        revalidatePath(`/product/${slug.current}`);
        // Synchronize the product with the relational database
        await SyncService.syncProduct(slug.current);
      }
    } else if (_type === "category") {
      revalidatePath("/collection");
    } else if (_type === "homepage" || _type === "siteSettings") {
      revalidatePath("/");
      revalidatePath("/", "layout"); // Clears everything globally
    } else {
      // Revalidate everything as a fallback
      revalidatePath("/", "layout");
    }

    logger.info({ type: _type }, "[WEBHOOK] Successfully processed");
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    logger.error({ err }, "[WEBHOOK ERROR] Processing failed");
    const details = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ message: "Error processing webhook", details }, { status: 500 });
  }
}
