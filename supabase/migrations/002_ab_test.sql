-- A/B/N Test tool: tests, variants (URL or image), responses
CREATE TABLE IF NOT EXISTS ab_tests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  magic_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_test_variants (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('url', 'image')),
  value TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ab_test_responses (
  id SERIAL PRIMARY KEY,
  test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_user_id ON ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_magic_slug ON ab_tests(magic_slug);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_test_id ON ab_test_variants(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_responses_test_id ON ab_test_responses(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_responses_variant_id ON ab_test_responses(variant_id);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all ab_tests" ON ab_tests;
DROP POLICY IF EXISTS "Allow all ab_test_variants" ON ab_test_variants;
DROP POLICY IF EXISTS "Allow all ab_test_responses" ON ab_test_responses;

CREATE POLICY "Allow all ab_tests" ON ab_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all ab_test_variants" ON ab_test_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all ab_test_responses" ON ab_test_responses FOR ALL USING (true) WITH CHECK (true);
