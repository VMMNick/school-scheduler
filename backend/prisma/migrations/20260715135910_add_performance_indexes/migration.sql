-- CreateIndex
CREATE INDEX "ScheduleSlot_teacherId_idx" ON "ScheduleSlot"("teacherId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_classId_idx" ON "ScheduleSlot"("classId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_subjectId_idx" ON "ScheduleSlot"("subjectId");

-- CreateIndex
CREATE INDEX "teacher_load_teacherId_idx" ON "teacher_load"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_load_classId_idx" ON "teacher_load"("classId");

-- CreateIndex
CREATE INDEX "teacher_load_subjectId_idx" ON "teacher_load"("subjectId");
