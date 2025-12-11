-- Changelog System
-- Public changelog for feature announcements

CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL, -- e.g., '1.2.0'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('feature', 'improvement', 'bugfix', 'breaking', 'security')),
  details TEXT, -- Markdown content
  image_url TEXT,
  video_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User changelog interactions (read/dismissed)
CREATE TABLE IF NOT EXISTS public.user_changelog_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changelog_id UUID NOT NULL REFERENCES public.changelog_entries(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful', 'neutral')),
  feedback_at TIMESTAMPTZ,
  UNIQUE(user_id, changelog_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_changelog_published ON public.changelog_entries(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_category ON public.changelog_entries(category);
CREATE INDEX IF NOT EXISTS idx_changelog_version ON public.changelog_entries(version);
CREATE INDEX IF NOT EXISTS idx_user_changelog_views_user ON public.user_changelog_views(user_id);

-- RLS Policies
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_changelog_views ENABLE ROW LEVEL SECURITY;

-- Everyone can read published changelog entries
CREATE POLICY "Anyone can view published changelog"
  ON public.changelog_entries FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Admins can manage changelog entries
CREATE POLICY "Admins can manage changelog"
  ON public.changelog_entries FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Users can view and create their own changelog views
CREATE POLICY "Users can manage their changelog views"
  ON public.user_changelog_views FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to get unread changelog count
CREATE OR REPLACE FUNCTION public.get_unread_changelog_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM changelog_entries ce
  WHERE ce.is_published = true
  AND NOT EXISTS (
    SELECT 1 FROM user_changelog_views ucv
    WHERE ucv.changelog_id = ce.id
    AND ucv.user_id = p_user_id
  );
  
  RETURN unread_count;
END;
$$;

-- Function to mark changelog as read
CREATE OR REPLACE FUNCTION public.mark_changelog_read(p_changelog_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_changelog_views (user_id, changelog_id)
  VALUES (auth.uid(), p_changelog_id)
  ON CONFLICT (user_id, changelog_id) DO NOTHING;
END;
$$;

-- Triggers
CREATE TRIGGER trigger_changelog_entries_updated_at
  BEFORE UPDATE ON public.changelog_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();