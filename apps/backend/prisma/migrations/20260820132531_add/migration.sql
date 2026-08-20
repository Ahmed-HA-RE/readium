/*
  Warnings:

  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[issuer,accountId]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `issuer` to the `account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account" ADD COLUMN     "issuer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT;

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account"("issuer", "accountId");
