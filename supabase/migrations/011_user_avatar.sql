-- Profilbillede: URL (storage eller data-URL i dev)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Offentlig bucket til profilbilleder (upload sker via service role i API)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow public reads for profile avatars" ON storage.objects;
CREATE POLICY "Allow public reads for profile avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-avatars');
