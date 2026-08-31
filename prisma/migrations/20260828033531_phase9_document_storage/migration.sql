-- AlterTable
ALTER TABLE "OrderDocument" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "storageKey" TEXT;
