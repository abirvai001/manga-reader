-- YourManga.EN storage setup (Supabase SQL Editor)
-- Run this ENTIRE script once. Uses only basic syntax (fixes error 42601).

-- ========== PART 1: create buckets ==========
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Optional size limits (ignore error if columns differ on your project)
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'pdfs';
UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = 'covers';
UPDATE storage.buckets SET file_size_limit = 3145728 WHERE id = 'ads';

-- ========== PART 2: remove old policies if any ==========
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

-- ========== PART 3: public read ==========
CREATE POLICY "ym_public_read_pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

CREATE POLICY "ym_public_read_covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "ym_public_read_ads"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

-- ========== PART 4: logged-in users can upload ==========
CREATE POLICY "ym_auth_insert_pdfs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "ym_auth_insert_covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "ym_auth_insert_ads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ads' AND auth.role() = 'authenticated');

CREATE POLICY "ym_auth_update_pdfs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "ym_auth_update_covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "ym_auth_update_ads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ads' AND auth.role() = 'authenticated');

CREATE POLICY "ym_auth_delete_pdfs"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "ym_auth_delete_covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "ym_auth_delete_ads"
ON storage.objects FOR DELETE
USING (bucket_id = 'ads' AND auth.role() = 'authenticated');
