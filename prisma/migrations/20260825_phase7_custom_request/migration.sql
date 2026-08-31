-- CreateEnum
CREATE TYPE "CustomRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'QUOTE_READY', 'CUSTOMER_DECLINED', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomRequestChannel" AS ENUM ('CUSTOMER_ONLINE', 'ADMIN_OFFLINE');

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "estimatedCompletionDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "customSpecification" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CustomRequest" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "channel" "CustomRequestChannel" NOT NULL,
    "status" "CustomRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "deliveryCharge" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "requiredAdvance" INTEGER NOT NULL DEFAULT 0,
    "estimatedCompletionDate" TIMESTAMP(3),
    "guestTokenHash" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRequestItem" (
    "id" TEXT NOT NULL,
    "customRequestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "designSpecs" TEXT,
    "dimensions" TEXT,
    "material" TEXT,
    "finish" TEXT,
    "notes" TEXT,
    "referenceImages" JSONB,
    "agreedUnitPrice" INTEGER,

    CONSTRAINT "CustomRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRequestEvent" (
    "id" TEXT NOT NULL,
    "customRequestId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "actor" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomRequest_guestTokenHash_key" ON "CustomRequest"("guestTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRequest_orderId_key" ON "CustomRequest"("orderId");

-- CreateIndex
CREATE INDEX "CustomRequest_mobileNumber_idx" ON "CustomRequest"("mobileNumber");

-- CreateIndex
CREATE INDEX "CustomRequest_status_idx" ON "CustomRequest"("status");

-- CreateIndex
CREATE INDEX "CustomRequest_channel_idx" ON "CustomRequest"("channel");

-- CreateIndex
CREATE INDEX "CustomRequest_createdAt_idx" ON "CustomRequest"("createdAt");

-- CreateIndex
CREATE INDEX "CustomRequestItem_customRequestId_idx" ON "CustomRequestItem"("customRequestId");

-- CreateIndex
CREATE INDEX "CustomRequestEvent_customRequestId_idx" ON "CustomRequestEvent"("customRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRequestEvent_customRequestId_sequence_key" ON "CustomRequestEvent"("customRequestId", "sequence");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRequest" ADD CONSTRAINT "CustomRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRequestItem" ADD CONSTRAINT "CustomRequestItem_customRequestId_fkey" FOREIGN KEY ("customRequestId") REFERENCES "CustomRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRequestEvent" ADD CONSTRAINT "CustomRequestEvent_customRequestId_fkey" FOREIGN KEY ("customRequestId") REFERENCES "CustomRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

