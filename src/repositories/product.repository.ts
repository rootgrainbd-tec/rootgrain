import "server-only";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ProductRepository {
  static async upsertProduct(slug: string, data: Partial<Prisma.ProductCreateInput>) {
    // This assumes slug is the unique identifier
    return prisma.product.upsert({
      where: { slug },
      update: {
        name: data.name ?? "",
        price: data.price ?? 0,
        inStock: data.inStock ?? true,
        // Update other fields as needed based on Sanity sync
      },
      create: {
        name: data.name ?? "Unknown",
        slug,
        category: data.category ?? "Uncategorized",
        price: data.price ?? 0,
        wood: data.wood ?? "Unknown",
        dimensions: data.dimensions ?? "Unknown",
        image: data.image ?? "",
        description: data.description ?? "",
        inStock: data.inStock ?? true,
      },
    });
  }

  static async findProductsBySlugs(slugs: string[]) {
    return prisma.product.findMany({
      where: { slug: { in: slugs } }
    });
  }
}
