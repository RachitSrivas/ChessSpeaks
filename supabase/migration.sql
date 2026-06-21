-- ============================================================
-- Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
-- ============================================================

-- 1. PROFILES table (one row per user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  rating      INTEGER NOT NULL DEFAULT 600,
  peak_rating INTEGER NOT NULL DEFAULT 600,
  wins        INTEGER NOT NULL DEFAULT 0,
  losses      INTEGER NOT NULL DEFAULT 0,
  draws       INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Note: if altering an existing table, you may need:
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles (for leaderboard)
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------

-- 2. GAME HISTORY table (one row per completed game)
CREATE TABLE IF NOT EXISTS public.game_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id     UUID,                       -- NULL for offline/computer games
  game_mode       TEXT NOT NULL,              -- 'offline' | 'online' | 'computer'
  result          TEXT NOT NULL,              -- 'win' | 'loss' | 'draw'
  player_color    TEXT NOT NULL,              -- 'w' | 'b'
  rating_before   INTEGER NOT NULL,
  rating_after    INTEGER NOT NULL,
  rating_change   INTEGER NOT NULL,
  total_moves     INTEGER NOT NULL DEFAULT 0,
  played_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own game history"
  ON public.game_history FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own game history"
  ON public.game_history FOR INSERT WITH CHECK (auth.uid() = player_id);

-- ----------------------------------------------------------------

-- 3. AUTO-CREATE PROFILE on sign-up (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
