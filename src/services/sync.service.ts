import "server-only";
import { ProductRepository } from "@/repositories/product.repository";
import { client } from "../../sanity/lib/client";
import { logger } from "@/lib/logger";

export class SyncService {
  /**
   * Syncs a product from Sanity to PostgreSQL
   */
  static async syncProduct(slug: string) {
    logger.info({ slug }, "Syncing product from Sanity to DB");

    try {
      // Fetch the latest product data from Sanity
      const sanityProduct = await client.fetch(
        `*[_type == "product" && slug.current == $slug][0] {
          "id": slug.current,
          "name": title,
          category,
          price,
          wood,
          dimensions,
          "image": image.asset->url,
          description,
          "inStock": availability != "Sold"
        }`,
        { slug }
      );

      if (!sanityProduct) {
        logger.warn({ slug }, "Product not found in Sanity during sync");
        return null;
      }

      // Upsert into Prisma
      const dbProduct = await ProductRepository.upsertProduct(slug, sanityProduct);
      
      logger.info({ slug, dbProductId: dbProduct.id }, "Product successfully synced");
      return dbProduct;
    } catch (error) {
      logger.error({ err: error, slug }, "Failed to sync product from Sanity");
      throw error;
    }
  }
}
