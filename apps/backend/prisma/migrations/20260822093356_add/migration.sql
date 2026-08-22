-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED');

-- AlterTable
ALTER TABLE "report" ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING';
