import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DocumentStagingService } from "@/services/document-staging.service";
import { getStorageAdapter } from "@/lib/infrastructure/storage";
import { logger } from "@/lib/logger";

/**
 * Validates request origin against host header to prevent CSRF.
 */
function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  const host = req.headers.get("host");
  if (!origin || !host) return true; // Server-to-server or non-browser request
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

/**
 * POST /api/admin/documents/stage
 * 
 * Generates and stages a candidate PDF artifact under an isolated staging key
 * from an existing immutable document snapshot without modifying active pointers.
 */
export async function POST(req: Request) {
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication required" }, { status: 401 });
    }

    // 2. Authorization Role Check
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Admin role required" }, { status: 403 });
    }

    // 3. CSRF / Origin Validation
    if (!validateOrigin(req)) {
      return NextResponse.json({ error: "FORBIDDEN", message: "Cross-origin requests forbidden" }, { status: 403 });
    }

    // 4. Request Body Validation
    const body = await req.json().catch(() => ({}));
    const { orderDocumentId, orderNumber, orderId } = body;

    if (!orderDocumentId && !orderNumber && !orderId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Missing identifier: must provide orderDocumentId, orderNumber, or orderId" },
        { status: 400 }
      );
    }

    const candidate = await DocumentStagingService.stageCandidateDocument({
      orderDocumentId: typeof orderDocumentId === "string" ? orderDocumentId : undefined,
      orderNumber: typeof orderNumber === "string" ? orderNumber : undefined,
      orderId: typeof orderId === "string" ? orderId : undefined,
      adminId: session.user.id,
    });

    return NextResponse.json(candidate, { status: 200 });
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed in document staging route");

    if (error.message?.includes("SETTLEMENT_VERIFICATION_REQUIRED") || error.message?.includes("FINANCIAL_VALIDATION_FAILED")) {
      return NextResponse.json(
        { error: "FINANCIAL_VALIDATION_FAILED", message: error.message },
        { status: 422 }
      );
    }
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: "NOT_FOUND", message: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/admin/documents/stage
 * 
 * Securely retrieves an authorized pre-signed URL or directly streams the staged candidate PDF
 * for administrative inspection and verification prior to promotion.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication required" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Admin role required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const candidateStorageKey = searchParams.get("candidateStorageKey");

    if (!candidateStorageKey || !candidateStorageKey.includes("/staged/") || !candidateStorageKey.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "candidateStorageKey required and must reside within the /staged/ namespace" },
        { status: 400 }
      );
    }

    const storage = getStorageAdapter();
    const exists = await storage.exists(candidateStorageKey);
    if (!exists) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Staged candidate blob not found" }, { status: 404 });
    }

    if (searchParams.get("download") === "true") {
      const buffer = await storage.download(candidateStorageKey);
      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${candidateStorageKey.split("/").pop()}"`,
        },
      });
    }

    const signedUrl = await storage.getSignedUrl(candidateStorageKey, 600);
    return NextResponse.json({ success: true, candidateSignedUrl: signedUrl }, { status: 200 });
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed in candidate inspection GET route");
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Internal Server Error" }, { status: 500 });
  }
}
