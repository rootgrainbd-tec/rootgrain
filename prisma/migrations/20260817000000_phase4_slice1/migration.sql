-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'INSTALLMENT', 'COD');

-- CreateEnum
CREATE TYPE "ProductionState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "DeliveryState" AS ENUM ('TBD', 'FINALIZED', 'OUT_FOR_DELIVERY', 'DELIVERED_AND_COLLECTED');

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentRecord" DROP CONSTRAINT "PaymentRecord_orderId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryState" "DeliveryState" NOT NULL DEFAULT 'TBD',
ADD COLUMN     "productionState" "ProductionState" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "requiredAdvance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
-- Safe type cast to preserve existing 'ADVANCE' records
ALTER TABLE "PaymentRecord" ALTER COLUMN "type" TYPE "PaymentType" USING "type"::text::"PaymentType";

-- DropEnum
DROP TYPE "PaymentPhase";



-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
