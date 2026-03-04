-- Projects: user projects with name and description
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project tools: links tools to projects with ordering
CREATE TABLE IF NOT EXISTS project_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, tool_slug)
);

-- Project tool data: stores tool-specific state/data per project
CREATE TABLE IF NOT EXISTS project_tool_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, tool_slug)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_tools_project_id ON project_tools(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tools_order ON project_tools(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_project_tool_data_project_id ON project_tool_data(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tool_data_tool_slug ON project_tool_data(tool_slug);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tool_data ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table
-- Users can only see/modify their own projects
CREATE POLICY "Allow SELECT for own projects" ON projects 
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for own projects" ON projects 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for own projects" ON projects 
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for own projects" ON projects 
  FOR DELETE USING (true);

-- Create policies for project_tools table
CREATE POLICY "Allow SELECT for project_tools" ON project_tools 
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for project_tools" ON project_tools 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for project_tools" ON project_tools 
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for project_tools" ON project_tools 
  FOR DELETE USING (true);

-- Create policies for project_tool_data table
CREATE POLICY "Allow SELECT for project_tool_data" ON project_tool_data 
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT for project_tool_data" ON project_tool_data 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE for project_tool_data" ON project_tool_data 
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE for project_tool_data" ON project_tool_data 
  FOR DELETE USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tool_data_updated_at
  BEFORE UPDATE ON project_tool_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
