/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "MetadataVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capabilities" JSONB,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_metadata" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "visibility" "MetadataVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_did_key" ON "agents"("did");

-- CreateIndex
CREATE INDEX "agents_status_idx" ON "agents"("status");

-- CreateIndex
CREATE INDEX "agent_metadata_agentId_idx" ON "agent_metadata"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_metadata_agentId_key_key" ON "agent_metadata"("agentId", "key");

-- AddForeignKey
ALTER TABLE "agent_metadata" ADD CONSTRAINT "agent_metadata_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
