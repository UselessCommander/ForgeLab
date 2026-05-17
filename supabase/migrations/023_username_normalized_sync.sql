-- Keep username_normalized in sync when display username changes.
-- Deploy order: run 021_username_normalized.sql before this migration.

CREATE OR REPLACE FUNCTION sync_username_normalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NOT NULL AND trim(NEW.username) <> '' THEN
    NEW.username_normalized := lower(trim(NEW.username));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_sync_username_normalized ON users;
CREATE TRIGGER users_sync_username_normalized
  BEFORE INSERT OR UPDATE OF username ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_username_normalized();
