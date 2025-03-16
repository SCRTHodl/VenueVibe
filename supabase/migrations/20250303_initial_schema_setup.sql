-- Initial schema setup for the main tables
-- This migration creates the necessary tables for the application

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_admin BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view other users" 
  ON public.users FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Create stories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_video BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stories
CREATE POLICY "Anyone can view published stories" 
  ON public.stories FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Users can insert their own stories" 
  ON public.stories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" 
  ON public.stories FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create token_economy schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS token_economy;

-- Create user_token_balances table
CREATE TABLE IF NOT EXISTS token_economy.user_token_balances (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_economy.token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Enable RLS on token tables
ALTER TABLE token_economy.user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.token_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for token tables
CREATE POLICY "Users can view their own token balance" 
  ON token_economy.user_token_balances FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" 
  ON token_economy.token_transactions FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = recipient_id);

-- Create helper function for getting subscriber count
CREATE OR REPLACE FUNCTION public.get_subscriber_count()
RETURNS json AS $$
DECLARE
  user_count INTEGER;
  story_count INTEGER;
  top_balances json;
BEGIN
  -- Get user count
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- Get story count
  SELECT COUNT(*) INTO story_count FROM public.stories;
  
  -- Get top balances
  SELECT json_agg(t) INTO top_balances
  FROM (
    SELECT user_id, balance
    FROM token_economy.user_token_balances
    ORDER BY balance DESC
    LIMIT 5
  ) t;
  
  -- Return as JSON
  RETURN json_build_object(
    'userCount', user_count,
    'storyCount', story_count,
    'topBalances', COALESCE(top_balances, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
