-- CreateEnum
CREATE TYPE "LifeStoryType" AS ENUM ('ANIMAL_STORY', 'SHELTER_NEWS');

-- AlterTable life_stories
ALTER TABLE "life_stories" ADD COLUMN "shelter_id" TEXT;
ALTER TABLE "life_stories" ADD COLUMN "type" "LifeStoryType" NOT NULL DEFAULT 'ANIMAL_STORY';
ALTER TABLE "life_stories" ADD COLUMN "title" TEXT;
ALTER TABLE "life_stories" ALTER COLUMN "animal_id" DROP NOT NULL;

-- Backfill shelter_id from animals
UPDATE "life_stories" ls
SET "shelter_id" = a."shelter_id"
FROM "animals" a
WHERE ls."animal_id" = a."id";

ALTER TABLE "life_stories" ALTER COLUMN "shelter_id" SET NOT NULL;

-- AlterTable media
ALTER TABLE "media" ALTER COLUMN "animal_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "life_stories" ADD CONSTRAINT "life_stories_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "life_stories_shelter_id_published_at_idx" ON "life_stories"("shelter_id", "published_at" DESC);
CREATE INDEX "media_life_story_id_idx" ON "media"("life_story_id");
