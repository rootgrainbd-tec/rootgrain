-- CreateEnum
CREATE TYPE "QualityInspectionStatus" AS ENUM ('PASS', 'FAIL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TrackingState" ADD VALUE 'REWORK';
ALTER TYPE "TrackingState" ADD VALUE 'READY_FOR_DISPATCH';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "QualityInspectionStatus" NOT NULL,
    "notes" TEXT,
    "evidenceKeys" JSONB,
    "inspectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QualityInspection_orderId_idx" ON "QualityInspection"("orderId");

-- CreateIndex
CREATE INDEX "QualityInspection_inspectorId_idx" ON "QualityInspection"("inspectorId");

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
