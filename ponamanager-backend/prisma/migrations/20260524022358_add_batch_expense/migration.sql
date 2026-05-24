-- DropForeignKey
ALTER TABLE "BatchExpense" DROP CONSTRAINT "BatchExpense_batchId_fkey";

-- AlterTable
ALTER TABLE "BatchExpense" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "batchId" TEXT;

-- AddForeignKey
ALTER TABLE "BatchExpense" ADD CONSTRAINT "BatchExpense_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
