-- CreateEnum
CREATE TYPE "CompanyBatchStatus" AS ENUM ('pending', 'delivered');

-- CreateEnum
CREATE TYPE "PonaType" AS ENUM ('Golda', 'Bagda', 'Vannamei');

-- AlterTable
ALTER TABLE "BatchOrder" ADD COLUMN     "companyMir" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "CompanyOrder" (
    "id" TEXT NOT NULL,
    "ponaType" TEXT NOT NULL,
    "paymentAmount" DOUBLE PRECISION NOT NULL,
    "ratePerPL" DOUBLE PRECISION NOT NULL,
    "expectedPL" DOUBLE PRECISION NOT NULL,
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "mirValue" DOUBLE PRECISION,
    "totalPoly" DOUBLE PRECISION,
    "totalPL" DOUBLE PRECISION,
    "actualAmount" DOUBLE PRECISION,
    "paidToCompany" DOUBLE PRECISION,
    "dueToCompany" DOUBLE PRECISION,
    "advanceToUs" DOUBLE PRECISION,
    "prevDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prevAdvance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAdvance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompanyOrder" ADD CONSTRAINT "CompanyOrder_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
