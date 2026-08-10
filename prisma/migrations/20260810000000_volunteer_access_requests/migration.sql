-- CreateEnum
CREATE TYPE "VolunteerAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "TelegramSessionState" ADD VALUE 'REQUEST_ACCESS_NAME';
ALTER TYPE "TelegramSessionState" ADD VALUE 'REQUEST_ACCESS_EMAIL';

-- CreateTable
CREATE TABLE "volunteer_access_requests" (
    "id" TEXT NOT NULL,
    "shelter_id" TEXT NOT NULL,
    "telegram_chat_id" BIGINT NOT NULL,
    "telegram_username" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "status" "VolunteerAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "volunteer_access_requests_shelter_id_status_idx" ON "volunteer_access_requests"("shelter_id", "status");
CREATE INDEX "volunteer_access_requests_telegram_chat_id_idx" ON "volunteer_access_requests"("telegram_chat_id");

-- AddForeignKey
ALTER TABLE "volunteer_access_requests" ADD CONSTRAINT "volunteer_access_requests_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_access_requests" ADD CONSTRAINT "volunteer_access_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
