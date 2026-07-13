-- Manga Reader — Supabase Schema
-- Run this in the Supabase SQL Editor

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manga_category ON manga(category_id);
CREATE INDEX IF NOT EXISTS idx_manga_created ON manga(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_zone ON ad_banners(placement_zone) WHERE is_active = true;

-- Storage buckets (run via dashboard or storage API)
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('pdfs', 'pdfs', true),
--   ('covers', 'covers', true),
--   ('ads', 'ads', true);

-- Public read policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read manga" ON manga FOR SELECT USING (true);
CREATE POLICY "Public read active ads" ON ad_banners FOR SELECT USING (is_active = true);

-- Admin write policies (authenticated users)
CREATE POLICY "Auth write categories" ON categories FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth write manga" ON manga FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth write ads" ON ad_banners FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Storage policies (public read, auth write)
-- CREATE POLICY "Public read pdfs" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');
-- CREATE POLICY "Auth upload pdfs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'authenticated');
-- CREATE POLICY "Auth update pdfs" ON storage.objects FOR UPDATE USING (bucket_id = 'pdfs' AND auth.role() = 'authenticated');
-- CREATE POLICY "Auth delete pdfs" ON storage.objects FOR DELETE USING (bucket_id = 'pdfs' AND auth.role() = 'authenticated');
-- Repeat for covers and ads buckets.

-- Seed sample categories
INSERT INTO categories (name, slug) VALUES
  ('Action', 'action'),
  ('Romance', 'romance'),
  ('Fantasy', 'fantasy'),
  ('Comedy', 'comedy'),
  ('Horror', 'horror')
ON CONFLICT (slug) DO NOTHING;
