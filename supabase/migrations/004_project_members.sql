-- Project collaboration: members and roles
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow SELECT for project_members" ON project_members;
DROP POLICY IF EXISTS "Allow INSERT for project_members" ON project_members;
DROP POLICY IF EXISTS "Allow UPDATE for project_members" ON project_members;
DROP POLICY IF EXISTS "Allow DELETE for project_members" ON project_members;

CREATE POLICY "Allow SELECT for project_members" ON project_members
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for project_members" ON project_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for project_members" ON project_members
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for project_members" ON project_members
  FOR DELETE USING (true);

-- Backfill owner memberships for existing projects
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.user_id, 'owner'
FROM projects p
ON CONFLICT (project_id, user_id) DO NOTHING;

