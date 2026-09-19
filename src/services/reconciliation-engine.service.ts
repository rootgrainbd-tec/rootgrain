import { client } from "../../sanity/lib/client";
import prisma from "@/lib/prisma";
import { mapSanityToCommerceProjection, SanityProductProjectionInput, CommerceProjection } from "@/lib/commerce/product-projection";
import { logger } from "@/lib/logger";
import { Product } from "@prisma/client";

export type DiscrepancyStatus = 
  | "IN_SYNC"
  | "STALE"
  | "FIELD_MISMATCH"
  | "MISSING_IN_DB"
  | "ORPHAN_IN_DB"
  | "MALFORMED_IN_SANITY"
  | "UNVERIFIABLE";

export interface ProductDiscrepancy {
  sanityId: string;
  slug: string | null;
  status: DiscrepancyStatus;
  reasons: string[];
  sanityUpdatedAt: Date | null;
  dbSanityUpdatedAt: Date | null;
  dbUpdatedAt: Date | null;
}

export interface ReconciliationReport {
  summary: {
    totalScanned: number;
    inSync: number;
    stale: number;
    fieldMismatch: number;
    missingInDb: number;
    orphanInDb: number;
    malformedInSanity: number;
    unverifiable: number;
  };
  discrepancies: ProductDiscrepancy[];
}

export class ReconciliationEngine {
  /**
   * Performs a best-effort complete reconciliation scan between Sanity and PostgreSQL.
   */
  static async scanFullUniverse(): Promise<ReconciliationReport> {
    const report: ReconciliationReport = {
      summary: {
        totalScanned: 0,
        inSync: 0,
        stale: 0,
        fieldMismatch: 0,
        missingInDb: 0,
        orphanInDb: 0,
        malformedInSanity: 0,
        unverifiable: 0,
      },
      discrepancies: []
    };

    try {
      const sanityMap = new Map<string, SanityProductProjectionInput>();
      const dbMap = new Map<string, Product>(); // Prisma Product

      // 1. Scan Sanity Universe
      const authoritativeClient = client.withConfig({ useCdn: false });
      const sanityLimit = 500;
      let lastSanityId = "";
      
      while (true) {
        const query = `*[_type == "product" && !(_id in path("drafts.**")) && _id > $lastId] | order(_id asc) [0...$limit] {
          _id,
          _updatedAt,
          "name": title,
          "slug": slug.current,
          "category": category->name,
          price,
          "woodTypes": woodTypes,
          dimensions,
          "image": heroImage.asset->url,
          "description": shortDescription,
          shippingType,
          availability,
          leadTimeDays
        }`;

        const page = await authoritativeClient.fetch<SanityProductProjectionInput[]>(query, { 
          lastId: lastSanityId, 
          limit: sanityLimit 
        });

        for (const doc of page) {
          const canonicalId = doc._id.replace(/^drafts\./, "");
          sanityMap.set(canonicalId, doc);
        }

        if (page.length < sanityLimit || page.length === 0) {
          break;
        }
        lastSanityId = page[page.length - 1]._id;
      }

      // 2. Scan PostgreSQL Universe (ALL rows)
      const dbLimit = 500;
      let lastDbSanityId: string | null = null;
      
      while (true) {
        const page: Product[] = await prisma.product.findMany({
          take: dbLimit,
          skip: lastDbSanityId ? 1 : 0,
          cursor: lastDbSanityId ? { sanityId: lastDbSanityId } : undefined,
          orderBy: { sanityId: "asc" }
        });

        for (const row of page) {
          if (row.sanityId) {
            dbMap.set(row.sanityId, row);
          }
        }

        if (page.length < dbLimit || page.length === 0) {
          break;
        }
        lastDbSanityId = page[page.length - 1].sanityId;
      }

      // 3. Compare
      const allSanityIds = new Set([
        ...Array.from(sanityMap.keys()),
        ...Array.from(dbMap.keys())
      ]);

      const sortedSanityIds = Array.from(allSanityIds).sort();

      report.summary.totalScanned = sortedSanityIds.length;

      for (const sanityId of sortedSanityIds) {
        const sanityDoc = sanityMap.get(sanityId);
        const dbRow = dbMap.get(sanityId);

        let status: DiscrepancyStatus;
        const reasons: string[] = [];
        let sanityUpdatedAt: Date | null = null;
        const dbSanityUpdatedAt: Date | null = dbRow?.sanityUpdatedAt ?? null;
        const dbUpdatedAt: Date | null = dbRow?.updatedAt ?? null;
        const slug = sanityDoc?.slug || dbRow?.slug || null;

        // Condition: DB-only
        if (!sanityDoc) {
          if (dbRow && dbRow.isActive) {
            status = "ORPHAN_IN_DB";
            reasons.push("Product exists and is active in DB, but not found in Sanity published universe.");
          } else {
            // Archived historical row. Skip counting it as an orphan discrepancy.
            // It does not increment orphan count. But it increments totalScanned.
            continue;
          }
        } else {
          // Condition: Sanity exists, check if well-formed
          let projected: CommerceProjection;
          try {
            projected = mapSanityToCommerceProjection(sanityDoc);
            sanityUpdatedAt = projected.sanityUpdatedAt;
          } catch (error: unknown) {
            status = "MALFORMED_IN_SANITY";
            reasons.push(`Mapper Error: ${(error as Error).message}`);
            
            report.discrepancies.push({
              sanityId,
              slug,
              status,
              reasons,
              sanityUpdatedAt: sanityDoc._updatedAt ? new Date(sanityDoc._updatedAt) : null,
              dbSanityUpdatedAt,
              dbUpdatedAt,
            });
            report.summary.malformedInSanity++;
            continue;
          }

          // Condition: MISSING_IN_DB
          if (!dbRow) {
            status = "MISSING_IN_DB";
            reasons.push("Published Sanity product exists but no PostgreSQL row found.");
          } else {
            // Both exist and Sanity is well-formed.
            // Check staleness precedence
            const isStale = (sanityUpdatedAt.getTime() > (dbSanityUpdatedAt?.getTime() ?? 0)) || (!dbSanityUpdatedAt);
            let hasFieldMismatch = false;

            // Check field mismatches
            if (dbRow.slug !== projected.slug) {
              hasFieldMismatch = true;
              reasons.push(`Slug mismatch: Sanity "${projected.slug}", DB "${dbRow.slug}"`);
            }
            if (dbRow.isActive !== true) { // Active in sanity, but inactive in DB
              hasFieldMismatch = true;
              reasons.push(`Lifecycle mismatch: Sanity is Active, DB is Inactive`);
            }
            if (dbRow.price !== projected.price) {
              hasFieldMismatch = true;
              reasons.push(`Price mismatch: Sanity ${projected.price}, DB ${dbRow.price}`);
            }
            if (dbRow.inStock !== projected.inStock) {
              hasFieldMismatch = true;
              reasons.push(`Stock mismatch: Sanity ${projected.inStock}, DB ${dbRow.inStock}`);
            }
            if (dbRow.isMto !== projected.isMto) {
              hasFieldMismatch = true;
              reasons.push(`MTO mismatch: Sanity ${projected.isMto}, DB ${dbRow.isMto}`);
            }
            if (dbRow.shippingType !== projected.shippingType) {
              hasFieldMismatch = true;
              reasons.push(`ShippingType mismatch: Sanity "${projected.shippingType}", DB "${dbRow.shippingType}"`);
            }
            if (dbRow.baseLeadTimeDays !== projected.baseLeadTimeDays) {
              hasFieldMismatch = true;
              reasons.push(`BaseLeadTimeDays mismatch: Sanity ${projected.baseLeadTimeDays}, DB ${dbRow.baseLeadTimeDays}`);
            }

            if (isStale) {
              status = "STALE";
              reasons.unshift(dbSanityUpdatedAt ? "Sanity timestamp is newer than DB sanityUpdatedAt" : "DB sanityUpdatedAt is null while Sanity has a valid timestamp");
            } else if (hasFieldMismatch) {
              status = "FIELD_MISMATCH";
            } else {
              status = "IN_SYNC";
            }
          }
        }

        report.discrepancies.push({
          sanityId,
          slug,
          status,
          reasons,
          sanityUpdatedAt,
          dbSanityUpdatedAt,
          dbUpdatedAt,
        });

        switch (status) {
          case "IN_SYNC": report.summary.inSync++; break;
          case "STALE": report.summary.stale++; break;
          case "FIELD_MISMATCH": report.summary.fieldMismatch++; break;
          case "MISSING_IN_DB": report.summary.missingInDb++; break;
          case "ORPHAN_IN_DB": report.summary.orphanInDb++; break;
        }
      }

      return report;

    } catch (error: unknown) {
      logger.error({ err: error }, "Reconciliation scan failed, returning UNVERIFIABLE");
      report.summary.unverifiable = 1;
      report.discrepancies = [{
        sanityId: "SYSTEM_FAILURE",
        slug: null,
        status: "UNVERIFIABLE",
        reasons: [`Scan failed: ${(error as Error).message}`],
        sanityUpdatedAt: null,
        dbSanityUpdatedAt: null,
        dbUpdatedAt: null,
      }];
      return report;
    }
  }
}
