-- CreateEnum
CREATE TYPE "TafsirSource" AS ENUM ('ibnkathir', 'jalalayn', 'saadi');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "refresh_token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "current_surah" INTEGER,
    "current_verse" INTEGER,
    "total_verses_read" INTEGER NOT NULL DEFAULT 0,
    "total_pages_read" INTEGER NOT NULL DEFAULT 0,
    "total_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "total_hasanat" BIGINT NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_read_date" DATE,
    "daily_goal_minutes" INTEGER NOT NULL DEFAULT 10,
    "daily_goal_verses" INTEGER NOT NULL DEFAULT 10,
    "today_verses_read" INTEGER NOT NULL DEFAULT 0,
    "today_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "weekly_progress" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_verses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "surah_number" INTEGER NOT NULL,
    "surah_name" TEXT NOT NULL,
    "verse_number" INTEGER NOT NULL,
    "arabic_text" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_verses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "verses_read" INTEGER NOT NULL DEFAULT 0,
    "time_minutes" INTEGER NOT NULL DEFAULT 0,
    "hasanat_earned" BIGINT NOT NULL DEFAULT 0,
    "goal_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "invite_code" TEXT NOT NULL,
    "admin_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "verses_read" INTEGER NOT NULL DEFAULT 0,
    "time_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tafsir" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "surah_number" INTEGER NOT NULL,
    "verse_number" INTEGER NOT NULL,
    "source" "TafsirSource" NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tafsir_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: uniques
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "reading_progress_user_id_key" ON "reading_progress"("user_id");
CREATE UNIQUE INDEX "unique_user_verse_favorite" ON "favorite_verses"("user_id", "surah_number", "verse_number");
CREATE UNIQUE INDEX "unique_user_date_log" ON "daily_logs"("user_id", "date");
CREATE UNIQUE INDEX "groups_invite_code_key" ON "groups"("invite_code");
CREATE UNIQUE INDEX "unique_group_member" ON "group_members"("group_id", "user_id");
CREATE UNIQUE INDEX "unique_group_user_date" ON "group_progress"("group_id", "user_id", "date");
CREATE UNIQUE INDEX "unique_tafsir_entry" ON "tafsir"("surah_number", "verse_number", "source");

-- CreateIndex: lookups
CREATE INDEX "favorite_verses_user_id_idx" ON "favorite_verses"("user_id");
CREATE INDEX "daily_logs_user_id_date_idx" ON "daily_logs"("user_id", "date");
CREATE INDEX "groups_admin_id_idx" ON "groups"("admin_id");
CREATE INDEX "group_members_user_id_idx" ON "group_members"("user_id");
CREATE INDEX "group_progress_group_id_date_idx" ON "group_progress"("group_id", "date");
CREATE INDEX "conversations_user_id_idx" ON "conversations"("user_id");
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");
CREATE INDEX "tafsir_surah_number_verse_number_idx" ON "tafsir"("surah_number", "verse_number");

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_verses" ADD CONSTRAINT "favorite_verses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "groups" ADD CONSTRAINT "groups_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_progress" ADD CONSTRAINT "group_progress_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_progress" ADD CONSTRAINT "group_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
