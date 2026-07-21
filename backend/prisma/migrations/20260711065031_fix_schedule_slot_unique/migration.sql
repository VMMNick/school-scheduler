/*
  Warnings:

  - A unique constraint covering the columns `[weekNumber,day,period,classId]` on the table `ScheduleSlot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ScheduleSlot_weekNumber_day_period_key";

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSlot_weekNumber_day_period_classId_key" ON "ScheduleSlot"("weekNumber", "day", "period", "classId");
