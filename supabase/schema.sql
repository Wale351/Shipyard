-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
-- Note: In Supabase, it's best practice to link your public users table 
-- to the internal auth.users table via the id.
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar TEXT,
  website_url TEXT,
  twitter_handle TEXT,
  github_handle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 2. CATEGORIES TABLE
-- ==========================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- ==========================================
-- 3. APPS TABLE
-- ==========================================
CREATE TABLE public.apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  github_url TEXT,
  builder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tech_stack TEXT[] DEFAULT '{}',
  screenshots TEXT[] DEFAULT '{}',
  build_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 4. VOTES TABLE
-- ==========================================
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Ensure a user can only vote for a specific app once
  UNIQUE(user_id, app_id)
);

-- ==========================================
-- 5. COMMENTS TABLE
-- ==========================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 6. FOLLOWERS TABLE
-- ==========================================
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Ensure a user can only follow another user once
  UNIQUE(follower_id, builder_id),
  -- Prevent users from following themselves
  CONSTRAINT cant_follow_self CHECK (follower_id != builder_id)
);

-- ==========================================
-- INDEXES FOR FAST QUERIES
-- ==========================================

-- Apps: Fast lookups by builder, category, and sorting by newest
CREATE INDEX idx_apps_builder_id ON public.apps(builder_id);
CREATE INDEX idx_apps_category_id ON public.apps(category_id);
CREATE INDEX idx_apps_created_at ON public.apps(created_at DESC);

-- Votes: Fast counting of votes per app, and checking if a user voted
CREATE INDEX idx_votes_app_id ON public.votes(app_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);

-- Comments: Fast retrieval of comments for an app, sorted by newest
CREATE INDEX idx_comments_app_id ON public.comments(app_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Followers: Fast counting of followers/following
CREATE INDEX idx_followers_builder_id ON public.followers(builder_id);
CREATE INDEX idx_followers_follower_id ON public.followers(follower_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) SETUP (Optional but recommended)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Basic permissive read policies for public viewing
CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on apps" ON public.apps FOR SELECT USING (true);
CREATE POLICY "Allow public read access on votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Allow public read access on comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public read access on followers" ON public.followers FOR SELECT USING (true);

-- Example write policy: Users can only insert their own votes
CREATE POLICY "Users can vote" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their vote" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 7. SEARCH FUNCTIONS
-- ==========================================

-- Full text search across app name, tagline, description, tech stack, and category
CREATE OR REPLACE FUNCTION public.search_apps(search_query text)
RETURNS SETOF public.apps AS $$
  SELECT apps.*
  FROM public.apps
  LEFT JOIN public.categories ON apps.category_id = categories.id
  WHERE 
    to_tsvector('english', 
      apps.name || ' ' || 
      coalesce(apps.tagline, '') || ' ' || 
      coalesce(apps.description, '') || ' ' || 
      coalesce(array_to_string(apps.tech_stack, ' '), '') || ' ' || 
      coalesce(categories.name, '')
    ) @@ websearch_to_tsquery('english', search_query);
$$ LANGUAGE sql STABLE;

-- Trending Score Algorithm
-- Considers total upvotes, total comments, recency, and activity in the last 24 hours.
CREATE OR REPLACE FUNCTION public.trending_score(app public.apps)
RETURNS numeric AS $$
DECLARE
  total_votes int;
  total_comments int;
  recent_votes int;
  recent_comments int;
  age_hours numeric;
  score numeric;
BEGIN
  -- Get votes
  SELECT 
    COUNT(*), 
    SUM(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END)
  INTO total_votes, recent_votes
  FROM public.votes WHERE app_id = app.id;
  
  -- Get comments
  SELECT 
    COUNT(*), 
    SUM(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END)
  INTO total_comments, recent_comments
  FROM public.comments WHERE app_id = app.id;
  
  -- Calculate age in hours
  age_hours := EXTRACT(EPOCH FROM (NOW() - app.created_at)) / 3600.0;
  
  -- Calculate score:
  -- Base points: 1 per vote, 2 per comment
  -- Recent points (last 24h): 5 per vote, 10 per comment
  -- Time decay: (age_hours + 2)^1.5
  score := (
    (COALESCE(total_votes, 0) * 1.0) + 
    (COALESCE(total_comments, 0) * 2.0) + 
    (COALESCE(recent_votes, 0) * 5.0) + 
    (COALESCE(recent_comments, 0) * 10.0)
  ) / POWER(age_hours + 2.0, 1.5);
  
  RETURN score;
END;
$$ LANGUAGE plpgsql STABLE;
