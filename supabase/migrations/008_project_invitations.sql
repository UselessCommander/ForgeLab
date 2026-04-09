-- Persistent project invitation notifications (cross-device)
CREATE TABLE IF NOT EXISTS project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invited_user_id TEXT NOT NULL,
  invited_by_user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ NULL,
  accepted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_invitations_invited_user_id
  ON project_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id
  ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_invited_at_desc
  ON project_invitations(invited_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_invitations_read_at
  ON project_invitations(read_at);

ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow SELECT for project_invitations" ON project_invitations;
DROP POLICY IF EXISTS "Allow INSERT for project_invitations" ON project_invitations;
DROP POLICY IF EXISTS "Allow UPDATE for project_invitations" ON project_invitations;
DROP POLICY IF EXISTS "Allow DELETE for project_invitations" ON project_invitations;

CREATE POLICY "Allow SELECT for project_invitations" ON project_invitations
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for project_invitations" ON project_invitations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for project_invitations" ON project_invitations
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for project_invitations" ON project_invitations
  FOR DELETE USING (true);

CREATE TRIGGER update_project_invitations_updated_at
  BEFORE UPDATE ON project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
