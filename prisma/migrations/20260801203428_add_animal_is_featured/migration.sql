-- AlterTable
ALTER TABLE "animals" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "animals_shelter_id_is_featured_idx" ON "animals"("shelter_id", "is_featured");
