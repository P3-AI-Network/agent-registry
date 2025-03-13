/*
  Warnings:

  - Added the required column `ownerId` to the `agents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "name" TEXT,
    "did" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_did_key" ON "users"("did");

-- CreateIndex
CREATE INDEX "users_did_idx" ON "users"("did");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_did_key" ON "users"("walletAddress", "did");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
