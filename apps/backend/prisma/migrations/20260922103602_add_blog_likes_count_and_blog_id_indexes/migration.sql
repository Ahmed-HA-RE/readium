-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "blog_isPublished_likesCount_idx" ON "blog"("isPublished", "likesCount");

-- CreateIndex
CREATE INDEX "bookmark_blogId_idx" ON "bookmark"("blogId");

-- CreateIndex
CREATE INDEX "comment_blogId_createdAt_idx" ON "comment"("blogId", "createdAt");

-- CreateIndex
CREATE INDEX "like_blogId_idx" ON "like"("blogId");

-- CreateIndex
CREATE INDEX "report_blogId_idx" ON "report"("blogId");
