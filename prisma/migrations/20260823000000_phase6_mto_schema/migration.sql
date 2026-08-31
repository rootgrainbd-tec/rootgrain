-- AlterTable
ALTER TABLE "Product" 
ADD COLUMN "isMto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "baseLeadTimeDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "additionalUnitLeadTimeDays" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Order" 
ADD COLUMN "isMtoOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "advanceDeadline" TIMESTAMP(3),
ADD COLUMN "estimatedManufacturingDays" INTEGER;

-- CreateTable
CREATE TABLE "AdminInternalNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminInternalNote_orderId_idx" ON "AdminInternalNote"("orderId");

-- AddForeignKey
ALTER TABLE "AdminInternalNote" ADD CONSTRAINT "AdminInternalNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
