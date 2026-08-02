-- CreateEnum
CREATE TYPE "ShelterMemberRole" AS ENUM ('ADMIN', 'VOLUNTEER', 'VETERINARIAN');

-- CreateEnum
CREATE TYPE "AnimalSpecies" AS ENUM ('CAT', 'DOG');

-- CreateEnum
CREATE TYPE "AnimalSex" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('SEEKING_SPONSOR', 'PARTIALLY_FUNDED', 'FULLY_SPONSORED', 'SEEKING_HOME', 'ADOPTED', 'PERMANENT_RESIDENT');

-- CreateEnum
CREATE TYPE "AnimalPersonality" AS ENUM ('PLAYFUL', 'CALM', 'SHY', 'SERIOUS', 'KITTEN');

-- CreateEnum
CREATE TYPE "AnimalMood" AS ENUM ('GREAT', 'GOOD', 'OK', 'NEEDS_ATTENTION');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "MedicalRecordType" AS ENUM ('CHECKUP', 'VACCINATION', 'SURGERY', 'TREATMENT', 'NOTE');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AdoptionApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('ONE_TIME', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AiDraftStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'REGENERATED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('TELEGRAM', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIFE_STORY', 'PHOTO', 'VIDEO', 'HEALTH_UPDATE', 'SPONSORSHIP', 'ADOPTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TelegramBotType" AS ENUM ('SPONSOR', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "TelegramSessionState" AS ENUM ('IDLE', 'NEW_ANIMAL_PHOTO', 'NEW_ANIMAL_NAME', 'NEWS_SELECT_ANIMAL', 'NEWS_UPLOAD_MEDIA', 'NEWS_CHOOSE_TEXT_MODE', 'NEWS_WRITE_TEXT', 'NEWS_AI_REVIEW', 'NEWS_EDIT_TEXT', 'LINK_ACCOUNT');

-- CreateTable
CREATE TABLE "shelters" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "website" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bank_iban" TEXT,
    "bank_recipient" TEXT,
    "bank_name" TEXT,
    "telegram_sponsor_bot_token" TEXT,
    "telegram_volunteer_bot_token" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'uk',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelter_members" (
    "id" TEXT NOT NULL,
    "shelter_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ShelterMemberRole" NOT NULL DEFAULT 'VOLUNTEER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shelter_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals" (
    "id" TEXT NOT NULL,
    "shelter_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "AnimalSpecies" NOT NULL DEFAULT 'CAT',
    "sex" "AnimalSex" NOT NULL DEFAULT 'UNKNOWN',
    "birth_date" TIMESTAMP(3),
    "status" "AnimalStatus" NOT NULL DEFAULT 'SEEKING_SPONSOR',
    "personality" "AnimalPersonality" NOT NULL DEFAULT 'CALM',
    "mood" "AnimalMood" NOT NULL DEFAULT 'GOOD',
    "description" TEXT,
    "character_traits" TEXT,
    "special_features" TEXT,
    "health_notes" TEXT,
    "vaccinated" BOOLEAN NOT NULL DEFAULT false,
    "sterilized" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "monthly_goal" DECIMAL(10,2),
    "current_funding" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "adopted_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_status_history" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "from_status" "AnimalStatus" NOT NULL,
    "to_status" "AnimalStatus" NOT NULL,
    "changed_by_id" TEXT,
    "note" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animal_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_stories" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" "AnimalMood",
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "life_story_id" TEXT,
    "type" "MediaType" NOT NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT,
    "thumbnail_url" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_drafts" (
    "id" TEXT NOT NULL,
    "life_story_id" TEXT NOT NULL,
    "generated_text" TEXT NOT NULL,
    "status" "AiDraftStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "variant_number" INTEGER NOT NULL DEFAULT 1,
    "photo_analysis" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "type" "MedicalRecordType" NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "record_date" TIMESTAMP(3) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorships" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "sponsor_id" TEXT NOT NULL,
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthly_amount" DECIMAL(10,2) NOT NULL,
    "message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "sponsorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorship_payments" (
    "id" TEXT NOT NULL,
    "sponsorship_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsorship_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_applications" (
    "id" TEXT NOT NULL,
    "shelter_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "status" "AdoptionApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "form_data" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adoption_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "shelter_id" TEXT NOT NULL,
    "donor_id" TEXT,
    "animal_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "DonationType" NOT NULL DEFAULT 'ONE_TIME',
    "message" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "username" TEXT,
    "bot_type" "TelegramBotType" NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_sessions" (
    "id" TEXT NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "bot_type" "TelegramBotType" NOT NULL,
    "state" "TelegramSessionState" NOT NULL DEFAULT 'IDLE',
    "context_data" JSONB NOT NULL DEFAULT '{}',
    "shelter_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_link_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bot_type" "TelegramBotType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "telegram_link_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "animal_id" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shelters_slug_key" ON "shelters"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "shelter_members_user_id_idx" ON "shelter_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shelter_members_shelter_id_user_id_key" ON "shelter_members"("shelter_id", "user_id");

-- CreateIndex
CREATE INDEX "animals_shelter_id_status_idx" ON "animals"("shelter_id", "status");

-- CreateIndex
CREATE INDEX "animals_shelter_id_is_public_idx" ON "animals"("shelter_id", "is_public");

-- CreateIndex
CREATE UNIQUE INDEX "animals_shelter_id_slug_key" ON "animals"("shelter_id", "slug");

-- CreateIndex
CREATE INDEX "animal_status_history_animal_id_changed_at_idx" ON "animal_status_history"("animal_id", "changed_at");

-- CreateIndex
CREATE INDEX "life_stories_animal_id_published_at_idx" ON "life_stories"("animal_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "media_animal_id_type_idx" ON "media"("animal_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ai_drafts_life_story_id_key" ON "ai_drafts"("life_story_id");

-- CreateIndex
CREATE INDEX "medical_records_animal_id_record_date_idx" ON "medical_records"("animal_id", "record_date" DESC);

-- CreateIndex
CREATE INDEX "sponsorships_sponsor_id_status_idx" ON "sponsorships"("sponsor_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sponsorships_animal_id_sponsor_id_key" ON "sponsorships"("animal_id", "sponsor_id");

-- CreateIndex
CREATE INDEX "sponsorship_payments_sponsorship_id_idx" ON "sponsorship_payments"("sponsorship_id");

-- CreateIndex
CREATE INDEX "adoption_applications_shelter_id_status_idx" ON "adoption_applications"("shelter_id", "status");

-- CreateIndex
CREATE INDEX "adoption_applications_animal_id_idx" ON "adoption_applications"("animal_id");

-- CreateIndex
CREATE INDEX "donations_shelter_id_created_at_idx" ON "donations"("shelter_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "telegram_accounts_user_id_idx" ON "telegram_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_chat_id_bot_type_key" ON "telegram_accounts"("chat_id", "bot_type");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_sessions_chat_id_bot_type_key" ON "telegram_sessions"("chat_id", "bot_type");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_link_codes_code_key" ON "telegram_link_codes"("code");

-- CreateIndex
CREATE INDEX "telegram_link_codes_code_idx" ON "telegram_link_codes"("code");

-- CreateIndex
CREATE INDEX "notifications_user_id_sent_created_at_idx" ON "notifications"("user_id", "sent", "created_at");

-- AddForeignKey
ALTER TABLE "shelter_members" ADD CONSTRAINT "shelter_members_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelter_members" ADD CONSTRAINT "shelter_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_status_history" ADD CONSTRAINT "animal_status_history_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_status_history" ADD CONSTRAINT "animal_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_stories" ADD CONSTRAINT "life_stories_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_stories" ADD CONSTRAINT "life_stories_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_life_story_id_fkey" FOREIGN KEY ("life_story_id") REFERENCES "life_stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_life_story_id_fkey" FOREIGN KEY ("life_story_id") REFERENCES "life_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_payments" ADD CONSTRAINT "sponsorship_payments_sponsorship_id_fkey" FOREIGN KEY ("sponsorship_id") REFERENCES "sponsorships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_applications" ADD CONSTRAINT "adoption_applications_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_applications" ADD CONSTRAINT "adoption_applications_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_applications" ADD CONSTRAINT "adoption_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
