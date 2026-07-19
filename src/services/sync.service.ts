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

    // Phase 3 - For lifecycle-authoritative reads require useCdn: false
    const authoritativeClient = client.withConfig({ useCdn: false });
    
    const query = `*[_type == "product" && _id == $id && !(_id in path("drafts.**"))][0] {
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
    }`;

    let sanityProduct = null;
    try {
      sanityProduct = await authoritativeClient.fetch(query, { id: canonicalSanityId });
    } catch (error) {
      logger.error({ err: error, sanityId: canonicalSanityId }, "Sanity query failed during reconciliation");
      throw error;
    }

    if (!sanityProduct || !sanityProduct.slug) {
      logger.info({ sanityId: canonicalSanityId }, "First query absent. Performing confirmation query to mitigate stale-result race.");
      
      let confirmationProduct = null;
      try {
        confirmationProduct = await authoritativeClient.fetch(query, { id: canonicalSanityId });
      } catch (error) {
        logger.error({ err: error, sanityId: canonicalSanityId }, "Sanity confirmation query failed");
        throw error;
      }

      if (!confirmationProduct || !confirmationProduct.slug) {
        logger.info({ sanityId: canonicalSanityId }, "Product confirmed absent in Sanity. Archiving.");
        const archiveResult = await ProductRepository.archiveProductBySanityId(canonicalSanityId);
        return archiveResult as ReconciliationResult;
      }

      logger.info({ sanityId: canonicalSanityId }, "Race mitigated: Product was republished before archive. Proceeding with upsert.");
      sanityProduct = confirmationProduct;
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
