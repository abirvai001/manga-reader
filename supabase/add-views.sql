-- Add view counts to manga (run once in Supabase SQL Editor)

ALTER TABLE manga
  ADD COLUMN IF NOT EXISTS views BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_manga_views ON manga (views DESC);

-- Atomic increment (callable by public so readers can register a view)
CREATE OR REPLACE FUNCTION public.increment_manga_views(manga_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE public.manga
  SET views = COALESCE(views, 0) + 1
  WHERE id = manga_id
    AND COALESCE(is_published, true) = true
  RETURNING views INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_manga_views(UUID) TO anon, authenticated, service_role;

-- Ensure public can still read views via existing SELECT policies
-- (no extra policy needed if "Public read published manga" already allows SELECT *)
