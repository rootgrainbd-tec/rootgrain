import "server-only";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ProductRepository {
  static async upsertProductBySanityId(sanityId: string, data: Partial<Prisma.ProductCreateInput> & { slug: string }) {
    if (!sanityId) throw new Error("sanityId is required");

    // Handle Prisma unique slug collision explicitly
    const existingWithSlug = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existingWithSlug && existingWithSlug.sanityId !== sanityId) {
      throw new Error(`Identity Collision: slug ${data.slug} is already in use by product with sanityId ${existingWithSlug.sanityId}`);
    }

    return prisma.product.upsert({
      where: { sanityId },
      update: {
        name: data.name ?? "",
        slug: data.slug,
        category: data.category ?? "Uncategorized",
        price: data.price ?? 0,
        wood: data.wood ?? "Unknown",
        dimensions: data.dimensions ?? "Unknown",
        image: data.image ?? "",
        description: data.description ?? "",
        inStock: data.inStock ?? true,
        isActive: true,
      },
      create: {
        sanityId,
        name: data.name ?? "Unknown",
        slug: data.slug,
        category: data.category ?? "Uncategorized",
        price: data.price ?? 0,
        wood: data.wood ?? "Unknown",
        dimensions: data.dimensions ?? "Unknown",
        image: data.image ?? "",
        description: data.description ?? "",
        inStock: data.inStock ?? true,
        isActive: true,
      },
    });
  }

  static async findProductsBySlugs(slugs: string[]) {
    return prisma.product.findMany({
      where: { slug: { in: slugs } }
    });
  }

  static async archiveProductBySanityId(sanityId: string) {
    if (!sanityId) throw new Error("sanityId is required");
    const existing = await prisma.product.findUnique({ where: { sanityId } });
    
    if (!existing) {
      return "NO_OP";
    }
    
    if (!existing.isActive) {
      return "NO_OP";
    }

    await prisma.product.update({
      where: { sanityId },
      data: { isActive: false },
    });

    return "ARCHIVED";
  }
}
