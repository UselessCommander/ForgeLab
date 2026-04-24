-- Project comments with reply functionality and canvas positioning
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES project_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  -- Canvas positioning for Figma-like comment pins
  position_x DECIMAL(10, 2) NULL,
  position_y DECIMAL(10, 2) NULL,
  -- Comment state
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_parent_id ON project_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_user_id ON project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_created_at ON project_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_comments_thread ON project_comments(project_id, parent_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow SELECT for project_comments" ON project_comments;
DROP POLICY IF EXISTS "Allow INSERT for project_comments" ON project_comments;
DROP POLICY IF EXISTS "Allow UPDATE for project_comments" ON project_comments;
DROP POLICY IF EXISTS "Allow DELETE for project_comments" ON project_comments;

-- Create policies for project_comments table
CREATE POLICY "Allow SELECT for project_comments" ON project_comments
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for project_comments" ON project_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for project_comments" ON project_comments
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for project_comments" ON project_comments
  FOR DELETE USING (true);

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_project_comments_updated_at ON project_comments;
CREATE TRIGGER update_project_comments_updated_at
  BEFORE UPDATE ON project_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
