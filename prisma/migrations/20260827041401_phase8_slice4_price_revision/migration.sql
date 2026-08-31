-- DropEnum
DROP TYPE "PermissionEffect";

-- CreateTable
CREATE TABLE "PriceRevision" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "previousProductPrice" INTEGER NOT NULL,
    "adjustment" INTEGER NOT NULL,
    "newProductPrice" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actor" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceRevision_orderId_idx" ON "PriceRevision"("orderId");

-- CreateIndex
CREATE INDEX "PriceRevision_orderItemId_idx" ON "PriceRevision"("orderItemId");

-- AddForeignKey
ALTER TABLE "PriceRevision" ADD CONSTRAINT "PriceRevision_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceRevision" ADD CONSTRAINT "PriceRevision_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
