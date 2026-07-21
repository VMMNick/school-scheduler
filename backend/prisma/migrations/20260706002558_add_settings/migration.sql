-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "schoolName" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "maxLessonsPerDay" INTEGER NOT NULL,
    "breakDuration" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
