-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "guestTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_guestTokenHash_key" ON "Order"("guestTokenHash");
