
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  bio_en text,
  bio_tl text,
  avatar_url text,
  theme jsonb,
  mood_en text,
  mood_tl text,
  mood_updated_at timestamptz,
  gcash_number text,
  gcash_enabled boolean NOT NULL DEFAULT false,
  pasaload_number text,
  pasaload_enabled boolean NOT NULL DEFAULT false,
  schedule_enabled boolean NOT NULL DEFAULT false,
  schedule_json jsonb,
  collab_enabled boolean NOT NULL DEFAULT false,
  collab_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Links table
CREATE TABLE public.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title_en text,
  title_tl text,
  url text,
  category text,
  icon_name text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_video boolean NOT NULL DEFAULT false,
  video_url text,
  video_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active links are viewable by everyone"
  ON public.links FOR SELECT
  USING (is_active = true OR auth.uid() = profile_id);

CREATE POLICY "Users can insert own links"
  ON public.links FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own links"
  ON public.links FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own links"
  ON public.links FOR DELETE
  USING (auth.uid() = profile_id);

-- Clicks table
CREATE TABLE public.clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  source text,
  country text
);

ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a click"
  ON public.clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can view own clicks"
  ON public.clicks FOR SELECT
  USING (auth.uid() = profile_id);

CREATE INDEX idx_links_profile ON public.links(profile_id);
CREATE INDEX idx_clicks_profile ON public.clicks(profile_id);
CREATE INDEX idx_clicks_link ON public.clicks(link_id);
