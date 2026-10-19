import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DocumentStagingService } from "@/services/document-staging.service";
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
 * POST /api/admin/documents/promote
 * 
 * Atomically promotes a verified candidate document to active storageKey.
 * Requires explicit optimistic concurrency lock (expectedCurrentStorageKey).
 * Preserves historical blob.
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
    const {
      orderDocumentId,
      expectedCurrentStorageKey,
      expectedPriorChecksum,
      candidateStorageKey,
      candidateChecksum,
      candidateSize,
    } = body;

    if (
      !orderDocumentId ||
      typeof orderDocumentId !== "string" ||
      !expectedCurrentStorageKey ||
      typeof expectedCurrentStorageKey !== "string" ||
      !candidateStorageKey ||
      typeof candidateStorageKey !== "string" ||
      !candidateChecksum ||
      typeof candidateChecksum !== "string" ||
      typeof candidateSize !== "number"
    ) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          message: "Missing or invalid required promotion fields: orderDocumentId, expectedCurrentStorageKey, candidateStorageKey, candidateChecksum, candidateSize (number)",
        },
        { status: 400 }
      );
    }

    const result = await DocumentStagingService.promoteCandidateDocument({
      orderDocumentId,
      expectedCurrentStorageKey,
      expectedPriorChecksum: typeof expectedPriorChecksum === "string" ? expectedPriorChecksum : undefined,
      candidateStorageKey,
      candidateChecksum,
      candidateSize,
      adminId: session.user.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed in document promotion route");

    if (error.message?.includes("CONCURRENT_MODIFICATION_DETECTED")) {
      return NextResponse.json(
        {
          error: "CONCURRENT_MODIFICATION_DETECTED",
          message: error.message,
        },
        { status: 409 }
      );
    }
    if (error.message?.includes("IDENTITY_BINDING_MISMATCH")) {
      return NextResponse.json(
        {
          error: "IDENTITY_BINDING_MISMATCH",
          message: error.message,
        },
        { status: 403 }
      );
    }
    if (error.message?.includes("INVALID_CANDIDATE_NAMESPACE")) {
      return NextResponse.json(
        {
          error: "INVALID_CANDIDATE_NAMESPACE",
          message: error.message,
        },
        { status: 400 }
      );
    }
    if (error.message?.includes("CANDIDATE_BLOB_NOT_FOUND") || error.message?.includes("not found")) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: error.message,
        },
        { status: 404 }
      );
    }
    if (
      error.message?.includes("CHECKSUM_MISMATCH") ||
      error.message?.includes("SIZE_MISMATCH") ||
      error.message?.includes("CANDIDATE_BLOB_EMPTY") ||
      error.message?.includes("FINANCIAL_VALIDATION_FAILED") ||
      error.message?.includes("SETTLEMENT_VERIFICATION_REQUIRED")
    ) {
      return NextResponse.json(
        {
          error: "UNPROCESSABLE_ENTITY",
          message: error.message,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Internal Server Error" }, { status: 500 });
  }
}
