-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastActivityAt" TIMESTAMP(3);

-- Backfill existing rows so they are not all counted as inactive. "createdAt" is
-- the only activity signal available for users that predate this column.
UPDATE "user" SET "lastActivityAt" = "createdAt" WHERE "lastActivityAt" IS NULL;

-- CreateIndex
CREATE INDEX "user_lastActivityAt_idx" ON "user"("lastActivityAt");
