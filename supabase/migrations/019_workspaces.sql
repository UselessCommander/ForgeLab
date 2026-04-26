-- Workspaces: named folders owned by a user
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- workspace_projects: many-to-many mapping of projects into workspaces
CREATE TABLE IF NOT EXISTS workspace_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_projects_workspace_id ON workspace_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_projects_project_id ON workspace_projects(project_id);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_all" ON workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "workspace_projects_all" ON workspace_projects FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
