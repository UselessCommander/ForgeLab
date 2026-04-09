-- RAG knowledge chunks per project (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS project_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_slug TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, source_slug, source_hash, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_project_knowledge_chunks_project_id
  ON project_knowledge_chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_chunks_source_slug
  ON project_knowledge_chunks(source_slug);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_chunks_embedding
  ON project_knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE project_knowledge_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow SELECT for project_knowledge_chunks" ON project_knowledge_chunks;
DROP POLICY IF EXISTS "Allow INSERT for project_knowledge_chunks" ON project_knowledge_chunks;
DROP POLICY IF EXISTS "Allow UPDATE for project_knowledge_chunks" ON project_knowledge_chunks;
DROP POLICY IF EXISTS "Allow DELETE for project_knowledge_chunks" ON project_knowledge_chunks;

CREATE POLICY "Allow SELECT for project_knowledge_chunks" ON project_knowledge_chunks
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for project_knowledge_chunks" ON project_knowledge_chunks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for project_knowledge_chunks" ON project_knowledge_chunks
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for project_knowledge_chunks" ON project_knowledge_chunks
  FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_project_knowledge_chunks_updated_at ON project_knowledge_chunks;

CREATE TRIGGER update_project_knowledge_chunks_updated_at
  BEFORE UPDATE ON project_knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION match_project_knowledge(
  query_embedding vector(1536),
  match_project_id uuid,
  match_count integer DEFAULT 8,
  match_source_slugs text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_slug text,
  chunk_text text,
  similarity double precision
)
LANGUAGE sql
AS $$
  SELECT
    pkc.id,
    pkc.source_slug,
    pkc.chunk_text,
    1 - (pkc.embedding <=> query_embedding) AS similarity
  FROM project_knowledge_chunks pkc
  WHERE pkc.project_id = match_project_id
    AND pkc.embedding IS NOT NULL
    AND (
      match_source_slugs IS NULL
      OR array_length(match_source_slugs, 1) IS NULL
      OR pkc.source_slug = ANY(match_source_slugs)
    )
  ORDER BY pkc.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;
