import "server-only";
import { ProductRepository } from "@/repositories/product.repository";
import { client } from "../../sanity/lib/client";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

export type ReconciliationResult = "CREATED" | "UPDATED" | "REACTIVATED" | "ARCHIVED" | "NO_OP";

export class SyncService {
  /**
   * Syncs a product from Sanity to PostgreSQL
   */
  static async syncProduct(slug: string) {
    logger.info({ slug }, "Legacy syncProduct called by slug");

    try {
      // Look up Sanity document by slug to find the _id
      const sanityProduct = await client.fetch(
        `*[_type == "product" && slug.current == $slug][0] { _id }`,
        { slug }
      );

      if (!sanityProduct || !sanityProduct._id) {
        logger.warn({ slug }, "Product not found in Sanity during legacy sync by slug");
        return null;
      }

      const canonicalSanityId = sanityProduct._id.replace(/^drafts\./, "");
      await this.reconcileProductBySanityId(canonicalSanityId);
      
      // Return something for legacy callers? They just check if it throws usually.
      return { id: canonicalSanityId };
    } catch (error) {
      logger.error({ err: error, slug }, "Failed to legacy sync product from Sanity");
      throw error;
    }
  }

  /**
   * Authoritative State-Reconciliation Lifecycle Engine
   */
  static async reconcileProductBySanityId(rawSanityId: string): Promise<ReconciliationResult> {
    const canonicalSanityId = rawSanityId.replace(/^drafts\./, "");
    logger.info({ sanityId: canonicalSanityId }, "Reconciling product by canonical sanityId");

    let sanityProduct = null;
    try {
      // Authoritative published Sanity query
      // _id filter naturally ignores "drafts.*" if we only pass canonical ID, 
      // but we add !(_id in path('drafts.**')) for strict safety.
      sanityProduct = await client.fetch(
        `*[_type == "product" && _id == $id && !(_id in path("drafts.**"))][0] {
          _id,
          "name": title,
          "slug": slug.current,
          category,
          price,
          wood,
          dimensions,
          "image": image.asset->url,
          description,
          "inStock": availability != "Sold"
        }`,
        { id: canonicalSanityId }
      );
    } catch (error) {
      // 3C. QUERY ERROR
      logger.error({ err: error, sanityId: canonicalSanityId }, "Sanity query failed during reconciliation");
      throw error; // ERROR != ABSENT. Do not archive.
    }

    if (!sanityProduct || !sanityProduct.slug) {
      // 3B. SUCCESS + ABSENT
      // To mitigate stale-result races (Phase 14), we could do a secondary check, 
      // but if the query successfully returned null, we proceed to archive.
      logger.info({ sanityId: canonicalSanityId }, "Product absent in Sanity. Archiving.");
      const archiveResult = await ProductRepository.archiveProductBySanityId(canonicalSanityId);
      return archiveResult as ReconciliationResult; // Returns ARCHIVED or NO_OP
    }

    // 3A. SUCCESS + FOUND
    // Map Product and Upsert
    // To accurately return CREATED / UPDATED / REACTIVATED, we peek first:
    const existing = await prisma.product.findUnique({ where: { sanityId: canonicalSanityId } });
    
    await ProductRepository.upsertProductBySanityId(canonicalSanityId, sanityProduct);

    if (!existing) {
      return "CREATED";
    } else if (!existing.isActive) {
      return "REACTIVATED";
    }
    return "UPDATED";
  }
}
