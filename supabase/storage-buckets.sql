-- YourManga.EN — Storage buckets + policies (REQUIRED for PDF uploads)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- 1) Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('pdfs', 'pdfs', true, 104857600, ARRAY['application/pdf']),
  ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('ads', 'ads', true, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) Clean old policies (safe to re-run)
DROP POLICY IF EXISTS "ym_public_read_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "ym_public_read_covers" ON storage.objects;
DROP POLICY IF EXISTS "ym_public_read_ads" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_insert_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_insert_covers" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_insert_ads" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_update_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_update_covers" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_update_ads" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_delete_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_delete_covers" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_delete_ads" ON storage.objects;
DROP POLICY IF EXISTS "Public read pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload pdfs" ON storage.objects;

-- 3) Public read (so readers can load PDFs/covers)
CREATE POLICY "ym_public_read_pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs');
CREATE POLICY "ym_public_read_covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "ym_public_read_ads" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');

-- 4) Authenticated admin write
CREATE POLICY "ym_auth_insert_pdfs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pdfs');
CREATE POLICY "ym_auth_insert_covers" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');
CREATE POLICY "ym_auth_insert_ads" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads');

CREATE POLICY "ym_auth_update_pdfs" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'pdfs');
CREATE POLICY "ym_auth_update_covers" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'covers');
CREATE POLICY "ym_auth_update_ads" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'ads');

CREATE POLICY "ym_auth_delete_pdfs" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'pdfs');
CREATE POLICY "ym_auth_delete_covers" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'covers');
CREATE POLICY "ym_auth_delete_ads" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'ads');
