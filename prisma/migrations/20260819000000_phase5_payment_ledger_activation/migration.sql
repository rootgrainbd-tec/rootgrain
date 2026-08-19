-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CASH';
ALTER TYPE "PaymentMethod" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "legacyAdvancePaid" INTEGER NOT NULL DEFAULT 0;

-- Custom Action 2: Data copy for Order
UPDATE "Order" SET "legacyAdvancePaid" = "advancePaid";

-- AlterTable (Add columns first)
ALTER TABLE "PaymentRecord" ADD COLUMN "recordedById" TEXT,
ADD COLUMN "reference" TEXT;

-- Custom Action 4: Data copy for PaymentRecord reference
UPDATE "PaymentRecord" SET "reference" = "bkashTrxId" WHERE "bkashTrxId" IS NOT NULL;

-- CreateTable
CREATE TABLE "PaymentReferenceClaim" (
    "reference" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReferenceClaim_pkey" PRIMARY KEY ("method","reference")
);

-- CreateIndex
CREATE INDEX "PaymentReferenceClaim_orderId_idx" ON "PaymentReferenceClaim"("orderId");

-- AddForeignKey
ALTER TABLE "PaymentReferenceClaim" ADD CONSTRAINT "PaymentReferenceClaim_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Custom Action 5: Data copy for PaymentReferenceClaim
INSERT INTO "PaymentReferenceClaim" ("reference", "method", "orderId", "createdAt")
SELECT "bkashTrxId", "method", "orderId", NOW() FROM "PaymentRecord" WHERE "bkashTrxId" IS NOT NULL;

-- DropIndex
DROP INDEX "PaymentRecord_bkashTrxId_key";

-- Custom Action 6: Drop bkashTrxId column
ALTER TABLE "PaymentRecord" DROP COLUMN "bkashTrxId";
