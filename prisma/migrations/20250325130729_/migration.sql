-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
