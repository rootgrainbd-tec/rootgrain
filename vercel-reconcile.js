const { PrismaClient } = require('@prisma/client');
async function reconcile() {
  const prisma = new PrismaClient();
  try {
    console.log("== RUNNING VERCEL PROD RECONCILIATION PHASE 7+ ==");
    
    // Phase 7 Collisions
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" RENAME COLUMN "estimatedCompletionDate" TO "estimatedCompletionDate_drift"`);
        console.log("Renamed estimatedCompletionDate");
    } catch(e) {}

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" RENAME COLUMN "customSpecification" TO "customSpecification_drift"`);
        console.log("Renamed customSpecification");
    } catch(e) {}

    // Phase 8 Slice 4 Collision
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "PriceRevision" RENAME TO "PriceRevision_drift"`);
        console.log("Renamed PriceRevision");
    } catch(e) {}

    // Other drifted columns added by patch_db.ts that might collide in future migrations
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" RENAME COLUMN "productionState" TO "productionState_drift"`);
        console.log("Renamed productionState");
    } catch(e) {}
    
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" RENAME COLUMN "advanceDeadline" TO "advanceDeadline_drift"`);
        console.log("Renamed advanceDeadline");
    } catch(e) {}
    
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays" TO "estimatedManufacturingDays_drift"`);
        console.log("Renamed estimatedManufacturingDays");
    } catch(e) {}
    
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" RENAME COLUMN "actualCompletionDate" TO "actualCompletionDate_drift"`);
        console.log("Renamed actualCompletionDate");
    } catch(e) {}

    console.log("== VERCEL PROD RECONCILIATION SUCCESS ==");
  } catch (e) {
    console.error("== VERCEL PROD RECONCILIATION FAILED ==", e);
  } finally {
    await prisma.$disconnect();
  }
}
reconcile();
