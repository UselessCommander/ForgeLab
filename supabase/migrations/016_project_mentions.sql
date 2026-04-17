-- Mention notifications for board/comment text
CREATE TABLE IF NOT EXISTS project_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('comment', 'board')),
  source_id TEXT NOT NULL,
  mentioned_user_id TEXT NOT NULL,
  mentioned_by_user_id TEXT NOT NULL,
  mention_text TEXT NOT NULL DEFAULT '',
  mention_context TEXT NOT NULL DEFAULT '',
  mentioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, source_type, source_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_mentions_mentioned_user_id
  ON project_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_project_mentions_project_id
  ON project_mentions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_mentions_mentioned_at_desc
  ON project_mentions(mentioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_mentions_read_at
  ON project_mentions(read_at);

ALTER TABLE project_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow SELECT for project_mentions" ON project_mentions;
DROP POLICY IF EXISTS "Allow INSERT for project_mentions" ON project_mentions;
DROP POLICY IF EXISTS "Allow UPDATE for project_mentions" ON project_mentions;
DROP POLICY IF EXISTS "Allow DELETE for project_mentions" ON project_mentions;

CREATE POLICY "Allow SELECT for project_mentions" ON project_mentions
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for project_mentions" ON project_mentions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for project_mentions" ON project_mentions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for project_mentions" ON project_mentions
  FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_project_mentions_updated_at ON project_mentions;
CREATE TRIGGER update_project_mentions_updated_at
  BEFORE UPDATE ON project_mentions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
