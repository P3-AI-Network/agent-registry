/*
  Warnings:

  - A unique constraint covering the columns `[didIdentifier]` on the table `agents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `didIdentifier` to the `agents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "didIdentifier" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "agents_didIdentifier_key" ON "agents"("didIdentifier");
