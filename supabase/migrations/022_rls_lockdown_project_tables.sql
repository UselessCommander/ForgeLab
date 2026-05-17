-- Lock down direct PostgREST access (anon key) on project-scoped tables.
--
-- Forgelab uses custom cookie session auth in Next.js API routes, not Supabase Auth JWT.
-- RLS cannot express per-user project membership without service-role + app-layer checks.
--
-- v1 approach:
--   1. Drop permissive USING (true) policies on project tables (deny anon/authenticated).
--   2. Server routes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) — see lib/supabase.ts.
--   3. Browser clients must use /api/* routes, not direct supabase.from('projects').
--
-- NOT changed here (still open RLS; access via API or intentional public flows):
--   users, qr_codes, scans, surveys, survey_responses, ab_tests*, password_reset_tokens
--
-- Apply AFTER deploying server code that prefers service role on the server.

-- projects, project_tools, project_tool_data
DROP POLICY IF EXISTS "Allow SELECT for own projects" ON projects;
DROP POLICY IF EXISTS "Allow INSERT for own projects" ON projects;
DROP POLICY IF EXISTS "Allow UPDATE for own projects" ON projects;
DROP POLICY IF EXISTS "Allow DELETE for own projects" ON projects;

DROP POLICY IF EXISTS "Allow SELECT for project_tools" ON project_tools;
DROP POLICY IF EXISTS "Allow INSERT for project_tools" ON project_tools;
DROP POLICY IF EXISTS "Allow UPDATE for project_tools" ON project_tools;
DROP POLICY IF EXISTS "Allow DELETE for project_tools" ON project_tools;

DROP POLICY IF EXISTS "Allow SELECT for project_tool_data" ON project_tool_data;
DROP POLICY IF EXISTS "Allow INSERT for project_tool_data" ON project_tool_data;
DROP POLICY IF EXISTS "Allow UPDATE for project_tool_data" ON project_tool_data;
DROP POLICY IF EXISTS "Allow DELETE for project_tool_data" ON project_tool_data;

-- project_members
DROP POLICY IF EXISTS "Allow SELECT for project_members" ON project_members;
DROP POLICY IF EXISTS "Allow INSERT for project_members" ON project_members;
DROP POLICY IF EXISTS "Allow UPDATE for project_members" ON project_members;
DROP POLICY IF EXISTS "Allow DELETE for project_members" ON project_members;

-- project_comments
DROP POLICY IF EXISTS "Allow SELECT for project_comments" ON project_comments;
DROP POLICY IF EXISTS "Allow INSERT for project_comments" ON project_comments;
DROP POLICY IF EXISTS "Allow UPDATE for project_comments" ON project_comments;
DROP POLICY IF EXISTS "Allow DELETE for project_comments" ON project_comments;

-- project_files
DROP POLICY IF EXISTS "Allow SELECT for project_files" ON project_files;
DROP POLICY IF EXISTS "Allow INSERT for project_files" ON project_files;
DROP POLICY IF EXISTS "Allow UPDATE for project_files" ON project_files;
DROP POLICY IF EXISTS "Allow DELETE for project_files" ON project_files;

-- project_mentions
DROP POLICY IF EXISTS "Allow SELECT for project_mentions" ON project_mentions;
DROP POLICY IF EXISTS "Allow INSERT for project_mentions" ON project_mentions;
DROP POLICY IF EXISTS "Allow UPDATE for project_mentions" ON project_mentions;
DROP POLICY IF EXISTS "Allow DELETE for project_mentions" ON project_mentions;

-- project_invitations
DROP POLICY IF EXISTS "Allow SELECT for project_invitations" ON project_invitations;
DROP POLICY IF EXISTS "Allow INSERT for project_invitations" ON project_invitations;
DROP POLICY IF EXISTS "Allow UPDATE for project_invitations" ON project_invitations;
DROP POLICY IF EXISTS "Allow DELETE for project_invitations" ON project_invitations;

-- project_knowledge_chunks
DROP POLICY IF EXISTS "Allow SELECT for project_knowledge_chunks" ON project_knowledge_chunks;
DROP POLICY IF EXISTS "Allow INSERT for project_knowledge_chunks" ON project_knowledge_chunks;
DROP POLICY IF EXISTS "Allow UPDATE for project_knowledge_chunks" ON project_knowledge_chunks;
DROP POLICY IF EXISTS "Allow DELETE for project_knowledge_chunks" ON project_knowledge_chunks;

-- project_invite_links
DROP POLICY IF EXISTS "Allow all for project_invite_links" ON project_invite_links;

-- workspaces
DROP POLICY IF EXISTS "workspaces_all" ON workspaces;
DROP POLICY IF EXISTS "workspace_projects_all" ON workspace_projects;
