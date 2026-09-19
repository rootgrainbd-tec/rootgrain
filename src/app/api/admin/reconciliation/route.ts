import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { ReconciliationEngine } from "@/services/reconciliation-engine.service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_DISCREPANCIES = 100;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminId = session.user.id || "unknown";
    logger.info({ adminId }, "Reconciliation scan requested");

    const startTime = Date.now();
    // Engine performs full read-only scan
    const rawReport = await ReconciliationEngine.scanFullUniverse();
    const duration = Date.now() - startTime;

    logger.info(
      { adminId, totalScanned: rawReport.summary.totalScanned, duration },
      "Reconciliation scan completed"
    );

    // Filter out IN_SYNC records to save payload size
    const filteredDiscrepancies = rawReport.discrepancies.filter(
      (d) => d.status !== "IN_SYNC"
    );

    // Bound the array
    const discrepanciesBounded = filteredDiscrepancies.length > MAX_DISCREPANCIES;
    const boundedDiscrepancies = filteredDiscrepancies.slice(0, MAX_DISCREPANCIES);

    // Serialize dates and sanitize error messages for the final DTO
    const sanitizedDiscrepancies = boundedDiscrepancies.map((d) => {
      let safeReasons = d.reasons;
      if (d.status === "UNVERIFIABLE" || d.status === "MALFORMED_IN_SANITY") {
        safeReasons = ["Internal diagnostic error encountered during evaluation."];
      }

      return {
        sanityId: d.sanityId,
        slug: d.slug,
        status: d.status,
        reasons: safeReasons,
        sanityUpdatedAt: d.sanityUpdatedAt ? d.sanityUpdatedAt.toISOString() : null,
        dbSanityUpdatedAt: d.dbSanityUpdatedAt ? d.dbSanityUpdatedAt.toISOString() : null,
        dbUpdatedAt: d.dbUpdatedAt ? d.dbUpdatedAt.toISOString() : null,
      };
    });

    const responseDto = {
      summary: rawReport.summary,
      discrepancies: sanitizedDiscrepancies,
      metadata: {
        discrepanciesBounded,
        limit: MAX_DISCREPANCIES,
      },
    };

    return NextResponse.json(responseDto, { status: 200 });
  } catch (error: unknown) {
    logger.error({ err: error }, "Failed to process admin reconciliation endpoint");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
