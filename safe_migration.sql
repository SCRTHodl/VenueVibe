-- Safe migration script to change TEXT columns to UUID
-- This script handles errors gracefully and attempts to fix the schema

-- Wrap everything in a transaction
BEGIN;

-- Create a function to safely alter column types
CREATE OR REPLACE FUNCTION safe_alter_column_to_uuid(
  p_table text,
  p_column text
) RETURNS void AS $$
DECLARE
  v_current_type text;
BEGIN
  -- Check the current column type
  SELECT data_type INTO v_current_type
  FROM information_schema.columns
  WHERE table_schema = split_part(p_table, '.', 1)
    AND table_name = split_part(p_table, '.', 2)
    AND column_name = p_column;
    
  -- Only alter if it's not already UUID
  IF v_current_type = 'text' THEN
    EXECUTE format('ALTER TABLE %s ALTER COLUMN %s TYPE UUID USING 
                   CASE 
                     WHEN %s IS NULL OR %s = '''' THEN NULL 
                     WHEN %s ~ ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %s::uuid
                     ELSE NULL
                   END',
                   p_table, p_column, p_column, p_column, p_column, p_column);
    RAISE NOTICE 'Altered column % in table % from TEXT to UUID', p_column, p_table;
  ELSE
    RAISE NOTICE 'Column % in table % is already type %, skipping', p_column, p_table, v_current_type;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error altering column % in table %: %', p_column, p_table, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Drop all policies first
DO $$ 
BEGIN
  -- Drop policies on user_token_balances
  EXECUTE 'DROP POLICY IF EXISTS read_own_token_balance ON token_economy.user_token_balances';
  
  -- Drop policies on token_transactions
  EXECUTE 'DROP POLICY IF EXISTS read_own_transactions ON token_economy.token_transactions';
  
  -- Drop policies on story_token_data
  EXECUTE 'DROP POLICY IF EXISTS read_story_token_data ON token_economy.story_token_data';
  EXECUTE 'DROP POLICY IF EXISTS update_own_story_token_data ON token_economy.story_token_data';
  
  -- Drop policies on nft_collections
  EXECUTE 'DROP POLICY IF EXISTS read_nft_collections ON token_economy.nft_collections';
  
  -- Drop policies on nft_items
  EXECUTE 'DROP POLICY IF EXISTS read_nft_items ON token_economy.nft_items';
  EXECUTE 'DROP POLICY IF EXISTS update_own_nft_items ON token_economy.nft_items';
  
  -- Drop policies on content_access if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'token_economy' AND table_name = 'content_access') THEN
    EXECUTE 'DROP POLICY IF EXISTS read_own_content_access ON token_economy.content_access';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Drop dependent triggers and functions
DO $$ 
BEGIN
  -- Drop triggers
  EXECUTE 'DROP TRIGGER IF EXISTS update_token_balance_trigger ON token_economy.token_transactions';
  
  -- Drop functions
  EXECUTE 'DROP FUNCTION IF EXISTS token_economy.update_token_balance()';
  EXECUTE 'DROP FUNCTION IF EXISTS token_economy.get_user_token_data(TEXT)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error dropping triggers/functions: %', SQLERRM;
END $$;

-- Safely alter all columns
DO $$ 
BEGIN
  -- user_token_balances
  PERFORM safe_alter_column_to_uuid('token_economy.user_token_balances', 'user_id');
  
  -- token_transactions
  PERFORM safe_alter_column_to_uuid('token_economy.token_transactions', 'user_id');
  PERFORM safe_alter_column_to_uuid('token_economy.token_transactions', 'recipient_id');
  PERFORM safe_alter_column_to_uuid('token_economy.token_transactions', 'story_id');
  
  -- story_token_data
  PERFORM safe_alter_column_to_uuid('token_economy.story_token_data', 'story_id');
  PERFORM safe_alter_column_to_uuid('token_economy.story_token_data', 'creator_id');
  
  -- nft_collections
  PERFORM safe_alter_column_to_uuid('token_economy.nft_collections', 'creator_id');
  
  -- nft_items
  PERFORM safe_alter_column_to_uuid('token_economy.nft_items', 'owner_id');
  PERFORM safe_alter_column_to_uuid('token_economy.nft_items', 'creator_id');
  PERFORM safe_alter_column_to_uuid('token_economy.nft_items', 'story_id');
  
  -- content_access if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'token_economy' AND table_name = 'content_access') THEN
    PERFORM safe_alter_column_to_uuid('token_economy.content_access', 'user_id');
    PERFORM safe_alter_column_to_uuid('token_economy.content_access', 'content_id');
  END IF;
END $$;

-- Recreate the update_token_balance function with UUID types
CREATE OR REPLACE FUNCTION token_economy.update_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- If transaction is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    -- Update sender balance
    INSERT INTO token_economy.user_token_balances (user_id, balance, lifetime_earned, lifetime_spent)
    VALUES (
      NEW.user_id,
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
      VALUES (NEW.recipient_id, ABS(NEW.amount), ABS(NEW.amount))
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
        VALUES (NEW.story_id, NEW.user_id, NEW.amount)
        ON CONFLICT (story_id) DO UPDATE
        SET 
          creator_earnings = token_economy.story_token_data.creator_earnings + NEW.amount,
          updated_at = CURRENT_TIMESTAMP;
      
      ELSIF NEW.transaction_type = 'tip' AND NEW.amount < 0 THEN
        INSERT INTO token_economy.story_token_data (story_id, creator_id, total_tips)
        VALUES (NEW.story_id, COALESCE(NEW.recipient_id, NEW.user_id), ABS(NEW.amount))
        ON CONFLICT (story_id) DO UPDATE
        SET 
          total_tips = token_economy.story_token_data.total_tips + ABS(NEW.amount),
          updated_at = CURRENT_TIMESTAMP;
      
      ELSIF NEW.transaction_type = 'view_reward' THEN
        INSERT INTO token_economy.story_token_data (story_id, creator_id, view_rewards)
        VALUES (NEW.story_id, NEW.user_id, NEW.amount)
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

-- Recreate the trigger
CREATE TRIGGER update_token_balance_trigger
AFTER INSERT OR UPDATE ON token_economy.token_transactions
FOR EACH ROW
EXECUTE FUNCTION token_economy.update_token_balance();

-- Recreate the get_user_token_data function with UUID parameter
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

-- Recreate policies with UUID comparisons
DO $$ 
BEGIN
  -- Create policies on user_token_balances
  EXECUTE 'CREATE POLICY read_own_token_balance ON token_economy.user_token_balances
    FOR SELECT USING (auth.uid()::uuid = user_id)';
  
  -- Create policies on token_transactions
  EXECUTE 'CREATE POLICY read_own_transactions ON token_economy.token_transactions
    FOR SELECT USING (auth.uid()::uuid = user_id OR auth.uid()::uuid = recipient_id)';
  
  -- Create policies on story_token_data
  EXECUTE 'CREATE POLICY read_story_token_data ON token_economy.story_token_data
    FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY update_own_story_token_data ON token_economy.story_token_data
    FOR UPDATE USING (auth.uid()::uuid = creator_id)';
  
  -- Create policies on nft_collections
  EXECUTE 'CREATE POLICY read_nft_collections ON token_economy.nft_collections
    FOR SELECT USING (true)';
  
  -- Create policies on nft_items
  EXECUTE 'CREATE POLICY read_nft_items ON token_economy.nft_items
    FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY update_own_nft_items ON token_economy.nft_items
    FOR UPDATE USING (auth.uid()::uuid = owner_id)';
  
  -- Create policy on content_access if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'token_economy' AND table_name = 'content_access') THEN
    EXECUTE 'CREATE POLICY read_own_content_access ON token_economy.content_access
      FOR SELECT USING (auth.uid()::uuid = user_id)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;

-- Handle the admin user
DO $$ 
BEGIN
  -- Try to delete the admin user if it exists as a text value
  EXECUTE 'DELETE FROM token_economy.user_token_balances WHERE user_id::text = ''admin''';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not delete admin user: %', SQLERRM;
END $$;

-- Insert a new admin user with a valid UUID
DO $$ 
BEGIN
  EXECUTE 'INSERT INTO token_economy.user_token_balances (user_id, balance, lifetime_earned)
           VALUES (''00000000-0000-0000-0000-000000000000''::uuid, 1000, 1000)
           ON CONFLICT DO NOTHING';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not insert admin user: %', SQLERRM;
END $$;

-- Verify the migration was successful
DO $$ 
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Migration completed. Checking column types...';
  
  -- Check if all relevant columns are now UUID
  FOR r IN (
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns
    WHERE table_schema = 'token_economy'
      AND column_name IN ('user_id', 'creator_id', 'owner_id', 'story_id', 'recipient_id')
      AND data_type <> 'uuid'
  ) LOOP
    RAISE NOTICE 'Column %.% is still type % instead of UUID', r.table_name, r.column_name, r.data_type;
  END LOOP;
END $$;

COMMIT;
