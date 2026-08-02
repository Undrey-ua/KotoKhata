-- CreateTable
CREATE TABLE "volunteer_invites" (
    "id" TEXT NOT NULL,
    "shelter_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ShelterMemberRole" NOT NULL DEFAULT 'VOLUNTEER',
    "invited_by_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "volunteer_invites_email_idx" ON "volunteer_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_invites_shelter_id_email_key" ON "volunteer_invites"("shelter_id", "email");

-- AddForeignKey
ALTER TABLE "volunteer_invites" ADD CONSTRAINT "volunteer_invites_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_invites" ADD CONSTRAINT "volunteer_invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
