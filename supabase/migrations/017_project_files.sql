-- Persistent PDF files per project
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by_user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'project-files',
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_files_storage_path
  ON project_files(storage_bucket, storage_path);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id_created_at
  ON project_files(project_id, created_at DESC);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow SELECT for project_files" ON project_files;
DROP POLICY IF EXISTS "Allow INSERT for project_files" ON project_files;
DROP POLICY IF EXISTS "Allow UPDATE for project_files" ON project_files;
DROP POLICY IF EXISTS "Allow DELETE for project_files" ON project_files;

CREATE POLICY "Allow SELECT for project_files" ON project_files
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for project_files" ON project_files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for project_files" ON project_files
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for project_files" ON project_files
  FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_project_files_updated_at ON project_files;
CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for project PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-files', 'project-files', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
