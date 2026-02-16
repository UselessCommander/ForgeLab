-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_url TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scans table for tracking individual scans
CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  qr_code_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT,
  referer TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_qr_code_id ON scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Slet de gamle policies hvis de eksisterer
DROP POLICY IF EXISTS "Allow all operations for users" ON users;
DROP POLICY IF EXISTS "Allow all operations for qr_codes" ON qr_codes;
DROP POLICY IF EXISTS "Allow all operations for scans" ON scans;

-- Create policies to allow all operations (vi håndterer auth i appen)
-- Brug separate policies for hver operation type for bedre kompatibilitet
CREATE POLICY "Allow SELECT for users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow INSERT for users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE for users" ON users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE for users" ON users FOR DELETE USING (true);

CREATE POLICY "Allow SELECT for qr_codes" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "Allow INSERT for qr_codes" ON qr_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE for qr_codes" ON qr_codes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE for qr_codes" ON qr_codes FOR DELETE USING (true);

CREATE POLICY "Allow SELECT for scans" ON scans FOR SELECT USING (true);
CREATE POLICY "Allow INSERT for scans" ON scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE for scans" ON scans FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE for scans" ON scans FOR DELETE USING (true);
