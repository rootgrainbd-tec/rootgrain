-- AlterTable
ALTER TABLE "OrderDocument" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ISSUED';

-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN     "invoiceDocumentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OrderDocument_documentType_referenceIdentity_key" ON "OrderDocument"("documentType", "referenceIdentity");

-- CreateIndex
CREATE INDEX "PaymentRecord_invoiceDocumentId_idx" ON "PaymentRecord"("invoiceDocumentId");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_invoiceDocumentId_fkey" FOREIGN KEY ("invoiceDocumentId") REFERENCES "OrderDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
