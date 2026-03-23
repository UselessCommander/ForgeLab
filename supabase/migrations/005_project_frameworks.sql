-- Project frameworks (e.g. none, double-diamond) and tool placement by phase

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS framework TEXT NOT NULL DEFAULT 'none';

ALTER TABLE project_tools
ADD COLUMN IF NOT EXISTS framework_phase TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_framework ON projects(framework);
CREATE INDEX IF NOT EXISTS idx_project_tools_framework_phase ON project_tools(project_id, framework_phase);

