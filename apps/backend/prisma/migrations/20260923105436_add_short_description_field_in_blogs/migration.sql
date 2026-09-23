/*
  Warnings:

  - Added the required column `shortDescription` to the `blog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "shortDescription" TEXT NOT NULL;
