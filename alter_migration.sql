-- Alter tables to fix type mismatches
-- This script modifies existing tables to use UUID types consistently

-- First drop existing policies that use auth.uid() without casting
DROP POLICY IF EXISTS "Users can view their own token balance" ON token_economy.user_token_balances;
DROP POLICY IF EXISTS "Users can view their own transactions" ON token_economy.token_transactions;
DROP POLICY IF EXISTS read_own_token_balance ON token_economy.user_token_balances;
DROP POLICY IF EXISTS read_own_transactions ON token_economy.token_transactions;
DROP POLICY IF EXISTS update_own_story_token_data ON token_economy.story_token_data;
DROP POLICY IF EXISTS update_own_nft_items ON token_economy.nft_items;
DROP POLICY IF EXISTS read_own_content_access ON token_economy.content_access;

-- Now recreate policies with proper casting
CREATE POLICY read_own_token_balance ON token_economy.user_token_balances
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY read_own_transactions ON token_economy.token_transactions
  FOR SELECT USING (auth.uid()::uuid = user_id OR auth.uid()::uuid = recipient_id);

CREATE POLICY read_story_token_data ON token_economy.story_token_data
  FOR SELECT USING (true);

CREATE POLICY update_own_story_token_data ON token_economy.story_token_data
  FOR UPDATE USING (auth.uid()::uuid = creator_id);

CREATE POLICY read_nft_collections ON token_economy.nft_collections
  FOR SELECT USING (true);

CREATE POLICY read_nft_items ON token_economy.nft_items
  FOR SELECT USING (true);

CREATE POLICY update_own_nft_items ON token_economy.nft_items
  FOR UPDATE USING (auth.uid()::uuid = owner_id);

-- Content access policies if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'token_economy' AND table_name = 'content_access') THEN
    EXECUTE 'CREATE POLICY read_own_content_access ON token_economy.content_access
      FOR SELECT USING (auth.uid()::uuid = user_id)';
  END IF;
END $$;

-- Check and fix function
DO $$ 
BEGIN
  -- Drop the function if it exists
  DROP FUNCTION IF EXISTS token_economy.get_user_token_data(UUID);
  
  -- Recreate with explicit UUID casting
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
END $$;
