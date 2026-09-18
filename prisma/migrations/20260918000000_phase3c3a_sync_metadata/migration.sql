-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN "sanityUpdatedAt" TIMESTAMP(3);
