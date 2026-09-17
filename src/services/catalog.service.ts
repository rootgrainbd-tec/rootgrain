import { ProductRepository } from "@/repositories/product.repository";
import type { Product, CommerceAwareProduct } from "@/types/product";

export class CatalogService {
  /**
   * Enriches an array of Sanity products with authoritative commerce state from PostgreSQL.
   */
  static async enrichProducts(products: Product[]): Promise<CommerceAwareProduct[]> {
    if (!products || products.length === 0) return [];

    const slugs = products.map(p => p.slug).filter(Boolean);
    
    let dbProductsMap = new Map<string, any>();
    
    try {
      const dbProducts = await ProductRepository.findProductsBySlugs(slugs);
      dbProductsMap = new Map(dbProducts.map(p => [p.slug, p]));
    } catch (error) {
      console.error("[CatalogService] Failed to fetch authoritative commerce state:", error);
      // Proceed with empty map to trigger safe fallback behavior
    }

    return products.map(product => {
      const dbProduct = dbProductsMap.get(product.slug);

      return {
        ...product,
        // Expose whether an authoritative database record exists
        hasCommerceRecord: Boolean(dbProduct),
        // Override with Prisma authoritative price if available
        price: dbProduct ? dbProduct.price : (product.price || 0),
        
        // Override with Prisma authoritative stock if available, else preserve Sanity fallback
        inStock: dbProduct ? dbProduct.inStock : (product.inStock ?? true),
        
        // Expose exact MTO status from DB
        isMto: Boolean(dbProduct?.isActive && dbProduct?.isMto),
        
        // Expose exact Active status from DB, preserving "available" fallback if missing
        isActive: dbProduct ? dbProduct.isActive : true, 
      };
    });
  }
}
