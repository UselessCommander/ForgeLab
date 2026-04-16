-- Knyt undersøgelser til projekt (analytics pr. projekt)
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_surveys_project_id ON surveys(project_id);
    