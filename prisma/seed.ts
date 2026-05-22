import { PrismaClient } from "@prisma/client";
import { SIGNATURE_COLLECTION } from "../src/data/products";
import { TESTIMONIALS } from "../src/data/testimonials";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Seed Products
  console.log("Seeding products...");
  for (const product of SIGNATURE_COLLECTION) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        price: product.price,
        comparePrice: product.comparePrice,
        wood: product.wood,
        dimensions: product.dimensions,
        image: product.image,
        description: product.description,
        inStock: product.inStock,
        featured: product.featured,
      },
    });
  }
  console.log(`✅ Seeded ${SIGNATURE_COLLECTION.length} products.`);

  // Seed Testimonials
  console.log("Seeding testimonials...");
  for (const t of TESTIMONIALS) {
    await prisma.testimonial.create({
      data: {
        quote: t.quote,
        author: t.author,
        location: t.location,
        piece: t.piece,
        approved: true, // Auto-approve the initial batch
      },
    });
  }
  console.log(`✅ Seeded ${TESTIMONIALS.length} testimonials.`);

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
