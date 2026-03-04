/*
  Warnings:

  - Made the column `projectId` on table `Submission` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_projectId_fkey";

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "projectId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
