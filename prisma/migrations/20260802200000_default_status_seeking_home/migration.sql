-- Default status for new animals
ALTER TABLE "animals" ALTER COLUMN "status" SET DEFAULT 'SEEKING_HOME';

-- Legacy statuses → seeking home
UPDATE "animals" SET "status" = 'SEEKING_HOME'
WHERE "status" IN ('SEEKING_SPONSOR', 'PERMANENT_RESIDENT');
