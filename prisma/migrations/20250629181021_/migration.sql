/*
  Warnings:

  - A unique constraint covering the columns `[seed]` on the table `agents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "agents_seed_key" ON "agents"("seed");
