-- AlterTable
ALTER TABLE "AbandonedCart" ADD COLUMN     "cartSessionId" TEXT,
ADD COLUMN     "isRecoveryEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCart_cartSessionId_key" ON "AbandonedCart"("cartSessionId");

-- CreateIndex
CREATE INDEX "AbandonedCart_userId_idx" ON "AbandonedCart"("userId");

-- AddForeignKey
ALTER TABLE "AbandonedCart" ADD CONSTRAINT "AbandonedCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

