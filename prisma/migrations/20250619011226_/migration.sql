/*
  Warnings:

  - A unique constraint covering the columns `[email,purpose]` on the table `MailCollector` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MailCollector_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "MailCollector_email_purpose_key" ON "MailCollector"("email", "purpose");
