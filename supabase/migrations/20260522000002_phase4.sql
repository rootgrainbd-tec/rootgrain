-- CreateEnum
CREATE TYPE "LogisticsProvider" AS ENUM ('PRIVATE_FREIGHT', 'PATHAO', 'REDX', 'DHL');

-- CreateEnum
CREATE TYPE "TrackingState" AS ENUM ('PENDING_PRODUCTION', 'IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED_AND_COLLECTED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "logistics" "LogisticsProvider" NOT NULL DEFAULT 'PRIVATE_FREIGHT';
ALTER TABLE "Order" ADD COLUMN "trackingState" "TrackingState" NOT NULL DEFAULT 'PENDING_PRODUCTION';

-- CreateTable
CREATE TABLE "BkashToken" (
    "id" TEXT NOT NULL DEFAULT 'bkash_singleton',
    "id_token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BkashToken_pkey" PRIMARY KEY ("id")
);
