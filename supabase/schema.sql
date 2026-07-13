-- YourManga.EN — Production Supabase Schema
-- Run entire file in: Supabase Dashboard → SQL Editor → New query → Run

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Manga titles
CREATE TABLE IF NOT EXISTS manga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  pdf_file_url TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad banners
CREATE TABLE IF NOT EXISTS ad_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_image_url TEXT NOT NULL,
  placement_zone TEXT NOT NULL CHECK (
    placement_zone IN (
      'homepage_top',
      'homepage_bottom',
      'sidebar',
      'listing_top',
      'viewer_top',
      'viewer_bottom',
      'viewer_inline'
    )
  ),
  target_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safe upgrades if tables already exist
ALTER TABLE manga ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE manga ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE ad_banners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_manga_category ON manga(category_id);
CREATE INDEX IF NOT EXISTS idx_manga_created ON manga(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manga_published ON manga(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_ads_zone ON ad_banners(placement_zone) WHERE is_active = true;

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS manga_updated_at ON manga;
CREATE TRIGGER manga_updated_at
  BEFORE UPDATE ON manga
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS ads_updated_at ON ad_banners;
CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON ad_banners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_banners ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('categories', 'manga', 'ad_banners')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Public read
CREATE POLICY "Public read categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Public read published manga"
  ON manga FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Public read active ads"
  ON ad_banners FOR SELECT
  USING (is_active = true OR auth.role() = 'authenticated');

-- Authenticated admin write
CREATE POLICY "Auth insert categories"
  ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update categories"
  ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete categories"
  ON categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert manga"
  ON manga FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update manga"
  ON manga FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete manga"
  ON manga FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert ads"
  ON ad_banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update ads"
  ON ad_banners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete ads"
  ON ad_banners FOR DELETE TO authenticated USING (true);

-- Storage buckets (public read for CDN delivery)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'pdfs', 'pdfs', true,
    104857600,
    ARRAY['application/pdf']
  ),
  (
    'covers', 'covers', true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'ads', 'ads', true,
    3145728,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'ym_%'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

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

CREATE POLICY "ym_public_read_pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs');
CREATE POLICY "ym_public_read_covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "ym_public_read_ads" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');

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

-- Seed categories
INSERT INTO categories (name, slug) VALUES
  ('Action', 'action'),
  ('Romance', 'romance'),
  ('Fantasy', 'fantasy'),
  ('Comedy', 'comedy'),
  ('Horror', 'horror')
ON CONFLICT (slug) DO NOTHING;
