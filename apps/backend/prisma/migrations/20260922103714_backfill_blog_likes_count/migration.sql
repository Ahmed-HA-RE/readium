-- Data migration, not a schema change. The preceding migration added
-- `blog.likesCount` with DEFAULT 0, so every existing row reads zero until it
-- is filled in from the rows it is denormalised from.
UPDATE "blog"
SET "likesCount" = COALESCE(counts.total, 0)
FROM (
  SELECT "blogId", COUNT(*)::int AS total
  FROM "like"
  GROUP BY "blogId"
) AS counts
WHERE "blog"."id" = counts."blogId";
