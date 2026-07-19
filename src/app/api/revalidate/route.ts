import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SyncService } from "../../../services/sync.service";
import { logger } from "../../../lib/logger";
import { timingSafeEqual } from "crypto";
import { ReconciliationResult } from "../../../services/sync.service";

export function createRevalidateHandler(deps: {
  reconcileProductBySanityId: (id: string) => Promise<ReconciliationResult>;
  revalidatePath: (path: string, type?: "layout" | "page") => void;
}) {
  return async function POST(req: NextRequest) {
    try {
      const secret = process.env.SANITY_WEBHOOK_SECRET;
      if (!secret) {
        logger.error("SANITY_WEBHOOK_SECRET is not configured");
        return NextResponse.json({ message: "Configuration error" }, { status: 500 });
      }

      const authHeader = req.headers.get("authorization");
      const expected = `Bearer ${secret}`;
      const provided = authHeader || "";

      if (expected.length !== provided.length) {
        logger.warn("Webhook authentication failed: length mismatch");
        return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
      }

      if (!timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
        logger.warn("Webhook authentication failed: timingSafeEqual mismatch");
        return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
      }

      let body;
      try {
        body = await req.json();
      } catch (err) {
        return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
      }

      const { _type, _id } = body;

      if (!_type || typeof _type !== "string") {
        return NextResponse.json({ message: "Missing or invalid _type" }, { status: 400 });
      }

      if (!_id || typeof _id !== "string") {
        return NextResponse.json({ message: "Missing or invalid _id" }, { status: 400 });
      }

      const trimmedId = _id.trim();
      if (!trimmedId || trimmedId.length === 0 || trimmedId.length > 200) {
        return NextResponse.json({ message: "Malformed _id" }, { status: 400 });
      }

      if (_type !== "product") {
        return NextResponse.json({ ok: true, action: "NO_OP" });
      }

      const canonicalId = trimmedId.replace(/^drafts\./, "");
      if (!canonicalId || canonicalId.length === 0) {
        return NextResponse.json({ message: "Malformed canonical _id" }, { status: 400 });
      }

      let action: ReconciliationResult;
      try {
        action = await deps.reconcileProductBySanityId(canonicalId);
      } catch (error) {
        logger.error({ err: error, canonicalId }, "Reconciliation failed during webhook");
        return NextResponse.json(
          { ok: false, error: "RECONCILIATION_FAILED", retryable: true },
          { status: 503 }
        );
      }

      try {
        deps.revalidatePath("/");
        deps.revalidatePath("/collection");
        deps.revalidatePath("/product/[slug]", "page");
        deps.revalidatePath("/category/[slug]", "page");
        deps.revalidatePath("/collection/[groupSlug]", "page");
      } catch (cacheError) {
        logger.error({ err: cacheError, canonicalId }, "Cache invalidation failed after DB success");
        return NextResponse.json(
          {
            ok: false,
            sanityId: canonicalId,
            action,
            error: "CACHE_INVALIDATION_FAILED",
            retryable: true,
          },
          { status: 503 }
        );
      }

      logger.info({ canonicalId, action }, "[WEBHOOK] Successfully processed lifecycle signal");
      return NextResponse.json({ ok: true, sanityId: canonicalId, action });
    } catch (err) {
      logger.error({ err }, "[WEBHOOK ERROR] Uncaught processing failure");
      const details = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ message: "Error processing webhook", details }, { status: 500 });
    }
  };
}

export const POST = createRevalidateHandler({
  reconcileProductBySanityId: SyncService.reconcileProductBySanityId.bind(SyncService),
  revalidatePath,
});
