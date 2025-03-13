/*
  Warnings:

  - A unique constraint covering the columns `[didIdentifier]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[walletAddress,didIdentifier]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `didIdentifier` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_did_idx";

-- DropIndex
DROP INDEX "users_did_key";

-- DropIndex
DROP INDEX "users_walletAddress_did_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "didIdentifier" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_didIdentifier_key" ON "users"("didIdentifier");

-- CreateIndex
CREATE INDEX "users_didIdentifier_idx" ON "users"("didIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_didIdentifier_key" ON "users"("walletAddress", "didIdentifier");
