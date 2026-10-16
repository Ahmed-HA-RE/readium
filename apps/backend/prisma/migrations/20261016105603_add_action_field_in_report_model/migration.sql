-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('WARNING', 'TEMPORARY_BAN', 'PERMANENT_BAN');

-- AlterTable
ALTER TABLE "report" ADD COLUMN     "action" "ModerationAction";
