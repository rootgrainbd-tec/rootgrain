import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { client as sanityClient } from "../sanity/lib/client";
import { seedAuthorization } from "./seed-authorization";

// ============================================================================
// 1. PRODUCTION SAFETY GUARD
// ============================================================================
const dbUrl = process.env.DATABASE_URL || "";
if (
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production" ||
  dbUrl.includes("supabase.co") ||
  dbUrl.includes("pooler.supabase.com") ||
  (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1"))
) {
  console.error("==========================================================");
  console.error("FATAL SAFETY GUARD TRIGGERED");
  console.error("Attempted to run seed against a remote or production database.");
  console.error("This script is ONLY for isolated local development databases.");
  console.error("==========================================================");
  process.exit(1);
}

// ============================================================================
// 2. LOCAL ADMIN PASSWORD VALIDATION
// ============================================================================
const localAdminPassword = process.env.LOCAL_ADMIN_PASSWORD;
if (!localAdminPassword) {
  console.error("==========================================================");
  console.error("FATAL: LOCAL_ADMIN_PASSWORD environment variable is missing.");
  console.error("You must provide a safe, local-only password to seed the Admin.");
  console.error("Do NOT use production passwords.");
  console.error("==========================================================");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Local Development Seed...");

  // We perform operations sequentially to handle partial failures cleanly.
  
  // ============================================================================
  // 3. STORE SETTINGS
  // ============================================================================
  console.log("Upserting StoreSettings...");
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      abandonedCartDelayHours: 24,
      abandonedCartDiscountPercent: 5,
      maintenanceMode: false,
    }
  });

  // ============================================================================
  // 4. SHIPPING RATES (District & Types)
  // ============================================================================
  console.log("Upserting ShippingRates...");
  await prisma.shippingRate.upsert({
    where: { district: "Dhaka" },
    update: { baseRate: 60, perItemRate: 0 },
    create: {
      district: "Dhaka",
      baseRate: 60,
      perItemRate: 0,
    }
  });

  await prisma.shippingRate.upsert({
    where: { district: "Outside Dhaka" },
    update: { baseRate: 120, perItemRate: 0 },
    create: {
      district: "Outside Dhaka",
      baseRate: 120,
      perItemRate: 0,
    }
  });

  console.log("Upserting ShippingTypeRates...");
  await prisma.shippingTypeRate.upsert({
    where: { shippingType: "STANDARD" },
    update: { baseRate: 100, additionalRate: 50 },
    create: {
      shippingType: "STANDARD",
      baseRate: 100,
      additionalRate: 50,
    }
  });

  // ============================================================================
  // 5. SANITY PRODUCT SYNCHRONIZATION
  // ============================================================================
  console.log("Fetching active products from Sanity...");
  try {
    const sanityProducts = await sanityClient.fetch(
      `*[_type == "product" && !(_id in path("drafts.**"))] {
        _id,
        "name": title,
        "slug": slug.current,
        "category": category->name,
        price,
        "wood": woodType,
        dimensions,
        "image": heroImage.asset->url,
        "description": shortDescription,
        "inStock": availability != "Sold"
      }`
    );

    if (!sanityProducts || sanityProducts.length === 0) {
      console.warn("WARNING: No active products found in Sanity. The storefront may appear empty.");
    } else {
      console.log(`Found ${sanityProducts.length} products. Syncing to Prisma...`);
      for (const p of sanityProducts) {
        if (!p._id) {
          console.warn("Skipping product due to missing _id");
          continue;
        }
        
        const canonicalSanityId = p._id.replace(/^drafts\./, "");
        
        if (!p.name) {
          console.warn(`Skipping product ${canonicalSanityId} due to missing name`);
          continue;
        }
        if (p.price === null || p.price === undefined) {
          console.warn(`Skipping product ${canonicalSanityId} due to missing price`);
          continue;
        }
        if (!p.slug) {
          console.warn(`Skipping product ${canonicalSanityId} due to missing slug`);
          continue;
        }
        if (!p.image) {
          console.warn(`Skipping product ${canonicalSanityId} due to missing heroImage URL`);
          continue;
        }

        const d = p.dimensions;
        const formattedDimensions = (d && d.length && d.width && d.height)
          ? `${d.length}" L × ${d.width}" W × ${d.height}" H`
          : "Unknown";

        await prisma.product.upsert({
          where: { sanityId: canonicalSanityId },
          update: {
            name: p.name,
            slug: p.slug,
            category: p.category ?? "Uncategorized",
            price: p.price,
            wood: p.wood ?? "Unknown",
            dimensions: formattedDimensions,
            image: p.image,
            description: p.description ?? "",
            inStock: p.inStock,
            isActive: true,
          },
          create: {
            sanityId: canonicalSanityId,
            name: p.name,
            slug: p.slug,
            category: p.category ?? "Uncategorized",
            price: p.price,
            wood: p.wood ?? "Unknown",
            dimensions: formattedDimensions,
            image: p.image,
            description: p.description ?? "",
            inStock: p.inStock,
            isActive: true,
          }
        });
      }
    }
  } catch (error) {
    console.error("==========================================================");
    console.error("FATAL: Failed to reach Sanity or sync products.");
    console.error(error);
    console.error("==========================================================");
    process.exit(1);
  }

  // ============================================================================
  // 6. AUTHORIZATION SEED
  // ============================================================================
  await seedAuthorization();

  // ============================================================================
  // 7. LOCAL ADMIN UPSERT
  // ============================================================================
  console.log("Upserting Local Admin...");
  const hashedAdminPassword = await hashPassword(localAdminPassword!);

  await prisma.user.upsert({
    where: { email: "admin@local.rootgrain.bd" },
    update: {
      passwordHash: hashedAdminPassword, // Update password if script is re-run with a new one
      role: Role.ADMIN,
    },
    create: {
      email: "admin@local.rootgrain.bd",
      name: "Local Admin",
      role: Role.ADMIN,
      passwordHash: hashedAdminPassword,
      emailVerified: new Date(),
    }
  });

  console.log("==========================================================");
  console.log("SUCCESS: Local Database Seed Complete");
  console.log("Local Admin created/updated.");
  console.log("StoreSettings created/updated.");
  console.log("Shipping rates created/updated.");
  console.log("Sanity products synchronized.");
  console.log("==========================================================");
}

main()
  .catch((e) => {
    console.error("==========================================================");
    console.error("FATAL: Seeding failed with an unexpected error.");
    console.error(e);
    console.error("==========================================================");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
