-- AlterTable
ALTER TABLE "shelter_members" ADD COLUMN "bio" TEXT;
ALTER TABLE "shelter_members" ADD COLUMN "show_on_contacts" BOOLEAN NOT NULL DEFAULT false;
