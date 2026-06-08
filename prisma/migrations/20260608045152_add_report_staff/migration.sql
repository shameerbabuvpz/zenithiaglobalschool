-- AlterTable
ALTER TABLE "SiteSetting" ALTER COLUMN "statStudents" SET DEFAULT '100+',
ALTER COLUMN "statTeachers" SET DEFAULT '10+',
ALTER COLUMN "statYears" SET DEFAULT '7+',
ALTER COLUMN "statAwards" SET DEFAULT '2+';

-- CreateTable
CREATE TABLE "ReportStaff" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "signatureUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportStaff_role_idx" ON "ReportStaff"("role");
