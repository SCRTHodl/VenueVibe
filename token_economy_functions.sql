-- Token Economy Database Functions
-- This approach uses database functions instead of edge functions

-- 1. Create token economy schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS token_economy;

-- 2. Create transaction tables if they don't exist
CREATE TABLE IF NOT EXISTS token_economy.user_token_balances (
  user_id UUID PRIMARY KEY REFERENCES public.users(id),
  balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_economy.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  recipient_id UUID REFERENCES public.users(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'spend', 'transfer'
  action TEXT NOT NULL, -- 'story_creation', 'nft_purchase', etc.
  reference_id UUID, -- ID of related content
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_economy.story_token_data (
  story_id UUID PRIMARY KEY, -- No foreign key to allow different schemas
  creator_id UUID NOT NULL REFERENCES public.users(id),
  tokens_earned INTEGER DEFAULT 0,
  tokens_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_economy.nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_economy.nft_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES token_economy.nft_collections(id),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.users(id),
  owner_id UUID NOT NULL REFERENCES public.users(id),
  token_price INTEGER NOT NULL DEFAULT 0,
  is_for_sale BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create token earning function
CREATE OR REPLACE FUNCTION token_economy.earn_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) 
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Insert into transactions
  INSERT INTO token_economy.token_transactions (
    user_id, amount, transaction_type, action, reference_id, description
  ) VALUES (
    p_user_id, p_amount, 'earn', p_action, p_reference_id, p_description
  );
  
  -- Update user balance
  INSERT INTO token_economy.user_token_balances (
    user_id, balance, lifetime_earned, lifetime_spent
  ) VALUES (
    p_user_id, p_amount, p_amount, 0
  )
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = token_economy.user_token_balances.balance + p_amount,
    lifetime_earned = token_economy.user_token_balances.lifetime_earned + p_amount,
    updated_at = now()
  RETURNING balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;

-- 4. Create token spending function
CREATE OR REPLACE FUNCTION token_economy.spend_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_recipient_id UUID DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) 
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check current balance
  SELECT balance INTO v_current_balance
  FROM token_economy.user_token_balances
  WHERE user_id = p_user_id;
  
  -- Handle first-time users
  IF v_current_balance IS NULL THEN
    INSERT INTO token_economy.user_token_balances (
      user_id, balance, lifetime_earned, lifetime_spent
    ) VALUES (
      p_user_id, 0, 0, 0
    );
    v_current_balance := 0;
  END IF;
  
  -- Check if user has enough tokens
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient token balance: % (required: %)', v_current_balance, p_amount;
  END IF;
  
  -- Insert into transactions
  INSERT INTO token_economy.token_transactions (
    user_id, recipient_id, amount, transaction_type, action, reference_id, description
  ) VALUES (
    p_user_id, p_recipient_id, p_amount, 'spend', p_action, p_reference_id, p_description
  );
  
  -- Update user balance
  UPDATE token_economy.user_token_balances
  SET 
    balance = balance - p_amount,
    lifetime_spent = lifetime_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- If there's a recipient, give them the tokens
  IF p_recipient_id IS NOT NULL THEN
    PERFORM token_economy.earn_tokens(
      p_recipient_id, p_amount, 'transfer_receive', p_reference_id, 
      'Received from ' || p_user_id::text || ': ' || COALESCE(p_description, '')
    );
  END IF;
  
  RETURN v_new_balance;
END;
$$;

-- 5. Create a function to get user token data
CREATE OR REPLACE FUNCTION token_economy.get_user_token_data(p_user_id UUID)
RETURNS TABLE (
  balance INTEGER,
  lifetime_earned INTEGER,
  lifetime_spent INTEGER,
  stories_count BIGINT,
  nfts_count BIGINT
) 
LANGUAGE plpgsql
AS $$
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

-- 6. Add RLS policies for token economy tables
ALTER TABLE token_economy.user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.story_token_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.nft_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own token balance
CREATE POLICY read_own_token_balance ON token_economy.user_token_balances
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- Admins can view all token balances
CREATE POLICY admin_read_all_balances ON token_economy.user_token_balances
  FOR SELECT USING (public.is_admin());

-- Users can view their own transactions
CREATE POLICY read_own_transactions ON token_economy.token_transactions
  FOR SELECT USING (auth.uid()::uuid = user_id OR auth.uid()::uuid = recipient_id);

-- Admins can view all transactions
CREATE POLICY admin_read_all_transactions ON token_economy.token_transactions
  FOR SELECT USING (public.is_admin());

-- Everyone can view story token data
CREATE POLICY read_story_token_data ON token_economy.story_token_data
  FOR SELECT USING (true);

-- Only creators can update their story token data
CREATE POLICY update_own_story_token_data ON token_economy.story_token_data
  FOR UPDATE USING (auth.uid()::uuid = creator_id);

-- Admins can update any story token data
CREATE POLICY admin_update_story_token_data ON token_economy.story_token_data
  FOR UPDATE USING (public.is_admin());

-- Everyone can view NFT collections
CREATE POLICY read_nft_collections ON token_economy.nft_collections
  FOR SELECT USING (true);

-- Everyone can view NFT items
CREATE POLICY read_nft_items ON token_economy.nft_items
  FOR SELECT USING (true);

-- Only owners can update their NFT items
CREATE POLICY update_own_nft_items ON token_economy.nft_items
  FOR UPDATE USING (auth.uid()::uuid = owner_id);

-- Admins can update any NFT item
CREATE POLICY admin_update_nft_items ON token_economy.nft_items
  FOR UPDATE USING (public.is_admin());
