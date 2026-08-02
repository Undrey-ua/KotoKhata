-- AlterEnum
ALTER TYPE "SponsorshipStatus" ADD VALUE 'PENDING' BEFORE 'ACTIVE';

-- AlterTable
ALTER TABLE "animals" ADD COLUMN "min_curatorship_amount" DECIMAL(10,2);
