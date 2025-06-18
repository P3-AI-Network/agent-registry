-- CreateEnum
CREATE TYPE "MailCollectorPurpose" AS ENUM ('NEWS_LETTER', 'EARLY_ACCESS');

-- CreateTable
CREATE TABLE "MailCollector" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "purpose" "MailCollectorPurpose" NOT NULL DEFAULT 'NEWS_LETTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailCollector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailCollector_email_key" ON "MailCollector"("email");
