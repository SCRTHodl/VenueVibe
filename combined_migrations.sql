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
  USING (auth.uid()::uuid = id);

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
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own stories" 
  ON public.stories FOR UPDATE 
  USING (auth.uid()::uuid = user_id);

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
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can view their own transactions" 
  ON token_economy.token_transactions FOR SELECT 
  USING (auth.uid()::uuid = user_id OR auth.uid()::uuid = recipient_id);

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
-- Create extensions (if they don't already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create token economy schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS token_economy;

-- Create needed tables for the SottoTokenized implementation
-- Using a dedicated schema in the main Supabase instance

-- User token balances table
CREATE TABLE token_economy.user_token_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_token_balances_user_id ON token_economy.user_token_balances(user_id);

-- Token transactions table
CREATE TABLE token_economy.token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_id UUID,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  story_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_transactions_user_id ON token_economy.token_transactions(user_id);
CREATE INDEX idx_token_transactions_recipient_id ON token_economy.token_transactions(recipient_id);
CREATE INDEX idx_token_transactions_story_id ON token_economy.token_transactions(story_id);
CREATE INDEX idx_token_transactions_status ON token_economy.token_transactions(status);

-- Story token data table
CREATE TABLE token_economy.story_token_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL UNIQUE,
  creator_id UUID NOT NULL,
  creator_earnings INTEGER NOT NULL DEFAULT 0,
  view_rewards INTEGER NOT NULL DEFAULT 0,
  tip_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  total_tips INTEGER NOT NULL DEFAULT 0,
  premium_content BOOLEAN NOT NULL DEFAULT FALSE,
  unlock_cost INTEGER NOT NULL DEFAULT 15,
  unlocks_count INTEGER NOT NULL DEFAULT 0,
  nft_minted BOOLEAN NOT NULL DEFAULT FALSE,
  nft_token_id TEXT,
  nft_contract_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_story_token_data_story_id ON token_economy.story_token_data(story_id);
CREATE INDEX idx_story_token_data_creator_id ON token_economy.story_token_data(creator_id);

-- NFT Collection table
CREATE TABLE token_economy.nft_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL,
  contract_address TEXT,
  token_standard TEXT NOT NULL DEFAULT 'ERC721',
  total_minted INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NFT Items table
CREATE TABLE token_economy.nft_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES token_economy.nft_collections(id),
  token_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  story_id UUID,
  image_url TEXT,
  metadata_url TEXT,
  token_uri TEXT,
  is_minted BOOLEAN NOT NULL DEFAULT FALSE,
  price INTEGER,
  is_for_sale BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, token_id)
);

CREATE INDEX idx_nft_items_owner_id ON token_economy.nft_items(owner_id);
CREATE INDEX idx_nft_items_creator_id ON token_economy.nft_items(creator_id);
CREATE INDEX idx_nft_items_story_id ON token_economy.nft_items(story_id);

-- Content Access table to track premium content unlocks
CREATE TABLE token_economy.content_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'premium_content',
  tokens_spent INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, content_id)
);

CREATE INDEX idx_content_access_user_id ON token_economy.content_access(user_id);
CREATE INDEX idx_content_access_content_id ON token_economy.content_access(content_id);

-- Create functions and triggers

-- Update token balance function
CREATE OR REPLACE FUNCTION token_economy.update_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- If transaction is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    -- Update sender balance
    INSERT INTO token_economy.user_token_balances (user_id, balance, lifetime_earned, lifetime_spent)
    VALUES (
      NEW.user_id::uuid,
      CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
      balance = token_economy.user_token_balances.balance + NEW.amount,
      lifetime_earned = token_economy.user_token_balances.lifetime_earned + 
        CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
      lifetime_spent = token_economy.user_token_balances.lifetime_spent + 
        CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
      updated_at = CURRENT_TIMESTAMP;
    
    -- Update recipient balance if applicable
    IF NEW.recipient_id IS NOT NULL AND NEW.amount < 0 THEN
      INSERT INTO token_economy.user_token_balances (user_id, balance, lifetime_earned)
      VALUES (NEW.recipient_id::uuid, ABS(NEW.amount), ABS(NEW.amount))
      ON CONFLICT (user_id) DO UPDATE
      SET 
        balance = token_economy.user_token_balances.balance + ABS(NEW.amount),
        lifetime_earned = token_economy.user_token_balances.lifetime_earned + ABS(NEW.amount),
        updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Update story token data if applicable
    IF NEW.story_id IS NOT NULL THEN
      IF NEW.transaction_type = 'creation_reward' THEN
        INSERT INTO token_economy.story_token_data (story_id, creator_id, creator_earnings)
        VALUES (NEW.story_id::uuid, NEW.user_id::uuid, NEW.amount)
        ON CONFLICT (story_id) DO UPDATE
        SET 
          creator_earnings = token_economy.story_token_data.creator_earnings + NEW.amount,
          updated_at = CURRENT_TIMESTAMP;
      
      ELSIF NEW.transaction_type = 'tip' AND NEW.amount < 0 THEN
        INSERT INTO token_economy.story_token_data (story_id, creator_id, total_tips)
        VALUES (NEW.story_id::uuid, COALESCE(NEW.recipient_id::uuid, NEW.user_id::uuid), ABS(NEW.amount))
        ON CONFLICT (story_id) DO UPDATE
        SET 
          total_tips = token_economy.story_token_data.total_tips + ABS(NEW.amount),
          updated_at = CURRENT_TIMESTAMP;
      
      ELSIF NEW.transaction_type = 'view_reward' THEN
        INSERT INTO token_economy.story_token_data (story_id, creator_id, view_rewards)
        VALUES (NEW.story_id::uuid, NEW.user_id::uuid, NEW.amount)
        ON CONFLICT (story_id) DO UPDATE
        SET 
          view_rewards = token_economy.story_token_data.view_rewards + NEW.amount,
          updated_at = CURRENT_TIMESTAMP;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for token transactions
CREATE TRIGGER update_token_balance_trigger
AFTER INSERT OR UPDATE ON token_economy.token_transactions
FOR EACH ROW
EXECUTE FUNCTION token_economy.update_token_balance();

-- Auto-complete transactions function
CREATE OR REPLACE FUNCTION token_economy.auto_complete_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Set status to completed for transactions that don't need approval
  IF NEW.status = 'pending' AND 
     (NEW.transaction_type IN ('creation_reward', 'view_reward', 'engagement_reward')) THEN
    NEW.status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-completing transactions
CREATE TRIGGER auto_complete_transactions_trigger
BEFORE INSERT ON token_economy.token_transactions
FOR EACH ROW
EXECUTE FUNCTION token_economy.auto_complete_transactions();

-- Update timestamp function
CREATE OR REPLACE FUNCTION token_economy.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_user_token_balances_timestamp
BEFORE UPDATE ON token_economy.user_token_balances
FOR EACH ROW
EXECUTE FUNCTION token_economy.update_timestamp();

CREATE TRIGGER update_token_transactions_timestamp
BEFORE UPDATE ON token_economy.token_transactions
FOR EACH ROW
EXECUTE FUNCTION token_economy.update_timestamp();

CREATE TRIGGER update_story_token_data_timestamp
BEFORE UPDATE ON token_economy.story_token_data
FOR EACH ROW
EXECUTE FUNCTION token_economy.update_timestamp();

CREATE TRIGGER update_nft_collections_timestamp
BEFORE UPDATE ON token_economy.nft_collections
FOR EACH ROW
EXECUTE FUNCTION token_economy.update_timestamp();

CREATE TRIGGER update_nft_items_timestamp
BEFORE UPDATE ON token_economy.nft_items
FOR EACH ROW
EXECUTE FUNCTION token_economy.update_timestamp();

-- RPC functions

-- Get user token data
CREATE OR REPLACE FUNCTION token_economy.get_user_token_data(p_user_id UUID)
RETURNS TABLE (
  balance INTEGER,
  lifetime_earned INTEGER,
  lifetime_spent INTEGER,
  stories_count BIGINT,
  nfts_count BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    utb.balance,
    utb.lifetime_earned,
    utb.lifetime_spent,
    COUNT(DISTINCT std.story_id)::BIGINT,
    COUNT(DISTINCT ni.id)::BIGINT
  FROM token_economy.user_token_balances utb
  LEFT JOIN token_economy.story_token_data std ON std.creator_id = p_user_id
  LEFT JOIN token_economy.nft_items ni ON ni.owner_id = p_user_id
  WHERE utb.user_id = p_user_id
  GROUP BY utb.balance, utb.lifetime_earned, utb.lifetime_spent;
END;
$$;

-- Set RLS policies

-- Enable RLS on all tables
ALTER TABLE token_economy.user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.story_token_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.nft_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.content_access ENABLE ROW LEVEL SECURITY;

-- Create policies
-- User Token Balances - users can read their own balance
CREATE POLICY read_own_token_balance ON token_economy.user_token_balances
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- Token Transactions - users can read their own transactions
CREATE POLICY read_own_transactions ON token_economy.token_transactions
  FOR SELECT USING (auth.uid()::uuid = user_id OR auth.uid()::uuid = recipient_id);

-- Story Token Data - anyone can read story token data
CREATE POLICY read_story_token_data ON token_economy.story_token_data
  FOR SELECT USING (true);

-- Story Token Data - only creator can update their story data
CREATE POLICY update_own_story_token_data ON token_economy.story_token_data
  FOR UPDATE USING (auth.uid()::uuid = creator_id);

-- NFT Collections - anyone can read collections
CREATE POLICY read_nft_collections ON token_economy.nft_collections
  FOR SELECT USING (true);

-- NFT Items - anyone can read items
CREATE POLICY read_nft_items ON token_economy.nft_items
  FOR SELECT USING (true);

-- NFT Items - only owner can update their items
CREATE POLICY update_own_nft_items ON token_economy.nft_items
  FOR UPDATE USING (auth.uid()::uuid = owner_id);

-- Content access policies
CREATE POLICY read_own_content_access ON token_economy.content_access
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- Create initial admin user with tokens
-- Use a specific UUID for the admin user to avoid NULL values
INSERT INTO token_economy.user_token_balances (user_id, balance, lifetime_earned)
VALUES ('00000000-0000-0000-0000-000000000000', 1000, 1000)
ON CONFLICT DO NOTHING;
