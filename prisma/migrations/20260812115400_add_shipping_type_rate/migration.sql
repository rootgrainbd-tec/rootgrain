-- CreateTable
CREATE TABLE "ShippingTypeRate" (
    "id" TEXT NOT NULL,
    "shippingType" TEXT NOT NULL,
    "baseRate" INTEGER NOT NULL,
    "additionalRate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingTypeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingTypeRate_shippingType_key" ON "ShippingTypeRate"("shippingType");
