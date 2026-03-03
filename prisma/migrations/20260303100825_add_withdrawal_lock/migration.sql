-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" INTEGER;
