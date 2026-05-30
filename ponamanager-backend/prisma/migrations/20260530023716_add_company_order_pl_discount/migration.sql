-- AlterTable
ALTER TABLE "CompanyOrder" ADD COLUMN     "discountAppliedAt" TIMESTAMP(3),
ADD COLUMN     "discountNotes" TEXT,
ADD COLUMN     "finalNetAmount" DOUBLE PRECISION,
ADD COLUMN     "plDiscountAmount" DOUBLE PRECISION,
ADD COLUMN     "plDiscountPL" DOUBLE PRECISION,
ADD COLUMN     "plDiscountPercent" DOUBLE PRECISION;
