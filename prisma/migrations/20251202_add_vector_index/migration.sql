-- CreateExtension (if not already exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create IVFFlat index for faster vector similarity search
-- This index uses cosine distance operator for similarity matching
-- Lists parameter (100) controls the trade-off between speed and accuracy
CREATE INDEX IF NOT EXISTS agents_embedding_idx 
ON agents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Note: After creating this index, you should run:
-- VACUUM ANALYZE agents;
-- This helps PostgreSQL optimize query planning with the new index
