-- Permanent residents are now treated as seeking home
UPDATE "animals" SET "status" = 'SEEKING_HOME' WHERE "status" = 'PERMANENT_RESIDENT';
