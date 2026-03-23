-- Normaliserede placeringer (0–1) for Double Diamond-ikoner pr. projekt: { "tool-slug": { "x", "y" } }
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS dd_canvas_layout JSONB NOT NULL DEFAULT '{}'::jsonb;
