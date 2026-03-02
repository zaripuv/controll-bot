-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" INTEGER;
