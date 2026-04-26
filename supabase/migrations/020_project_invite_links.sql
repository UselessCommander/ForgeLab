-- Invite links for projects
CREATE TABLE IF NOT EXISTS project_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_invite_links_project_id
  ON project_invite_links(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invite_links_token
  ON project_invite_links(token);

ALTER TABLE project_invite_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for project_invite_links" ON project_invite_links
  FOR ALL USING (true) WITH CHECK (true);
