-- CreateTable
CREATE TABLE "curator_notes" (
    "id" TEXT NOT NULL,
    "shelter_id" TEXT NOT NULL,
    "sponsor_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curator_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curator_notes_shelter_id_sponsor_id_created_at_idx" ON "curator_notes"("shelter_id", "sponsor_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "curator_notes" ADD CONSTRAINT "curator_notes_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curator_notes" ADD CONSTRAINT "curator_notes_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curator_notes" ADD CONSTRAINT "curator_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
