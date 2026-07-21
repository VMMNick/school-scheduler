/*
  Warnings:

  - You are about to drop the column `breakDuration` on the `Setting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClassGroup" ADD COLUMN     "maxLessonsPerDay" INTEGER;

-- AlterTable
ALTER TABLE "Setting" DROP COLUMN "breakDuration";
