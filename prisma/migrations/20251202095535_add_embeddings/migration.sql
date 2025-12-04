-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "embedding" vector(1536);
