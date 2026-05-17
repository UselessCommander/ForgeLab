-- Case-insensitive username lookup without full-table scans.
-- Deploy before 023_username_normalized_sync.sql. Requires server SUPABASE_SERVICE_ROLE_KEY after 022 RLS lockdown.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username_normalized TEXT;

UPDATE users
SET username_normalized = lower(trim(username))
WHERE username IS NOT NULL
  AND trim(username) <> ''
  AND (username_normalized IS NULL OR username_normalized = '');

-- Resolve case-insensitive duplicates: keep oldest account, suffix others
DO $$
DECLARE
  rec RECORD;
  dup_id TEXT;
  i INT;
BEGIN
  FOR rec IN
    SELECT username_normalized, array_agg(id ORDER BY created_at ASC) AS ids
    FROM users
    WHERE username_normalized IS NOT NULL
    GROUP BY username_normalized
    HAVING count(*) > 1
  LOOP
    i := 2;
    WHILE i <= array_length(rec.ids, 1) LOOP
      dup_id := rec.ids[i];
      UPDATE users
      SET username_normalized = rec.username_normalized || '_' || substring(dup_id from 1 for 6)
      WHERE id = dup_id;
      i := i + 1;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE users ALTER COLUMN username_normalized SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_normalized ON users(username_normalized);
