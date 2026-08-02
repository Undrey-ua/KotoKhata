-- Curator relationship status (separate from payment workflow status)
CREATE TYPE "CuratorRelationshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

ALTER TABLE "sponsorships"
  ADD COLUMN "curator_status" "CuratorRelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "contribution_interval_days" INTEGER NOT NULL DEFAULT 30;

UPDATE "sponsorships" SET "curator_status" = 'PAUSED' WHERE "status" = 'PAUSED';
UPDATE "sponsorships" SET "curator_status" = 'ENDED' WHERE "status" = 'CANCELLED';
