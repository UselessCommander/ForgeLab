ALTER TABLE users
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users (email)
WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
ON password_reset_tokens(expires_at);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow SELECT for password_reset_tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow INSERT for password_reset_tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow UPDATE for password_reset_tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow DELETE for password_reset_tokens" ON password_reset_tokens;

CREATE POLICY "Allow SELECT for password_reset_tokens" ON password_reset_tokens FOR SELECT USING (true);
CREATE POLICY "Allow INSERT for password_reset_tokens" ON password_reset_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE for password_reset_tokens" ON password_reset_tokens FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE for password_reset_tokens" ON password_reset_tokens FOR DELETE USING (true);
