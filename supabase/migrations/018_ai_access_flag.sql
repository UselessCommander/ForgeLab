-- Explicit AI adgangsflag pr. bruger
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT false;

