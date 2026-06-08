-- CreateTable
CREATE TABLE "ReportSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "subjects" TEXT[],
    "academicYear" TEXT NOT NULL DEFAULT '2026-27',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSettings_pkey" PRIMARY KEY ("id")
);
