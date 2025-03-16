-- Minimal migration script to fix UUID issues
-- This script focuses only on the essential changes needed

-- Drop all policies first to avoid conflicts
DROP POLICY IF EXISTS read_own_token_balance ON token_economy.user_token_balances;
DROP POLICY IF EXISTS read_own_transactions ON token_economy.token_transactions;
DROP POLICY IF EXISTS read_story_token_data ON token_economy.story_token_data;
DROP POLICY IF EXISTS update_own_story_token_data ON token_economy.story_token_data;
DROP POLICY IF EXISTS read_nft_collections ON token_economy.nft_collections;
DROP POLICY IF EXISTS read_nft_items ON token_economy.nft_items;
DROP POLICY IF EXISTS update_own_nft_items ON token_economy.nft_items;

-- Drop triggers and functions that depend on the columns
DROP TRIGGER IF EXISTS update_token_balance_trigger ON token_economy.token_transactions;
DROP FUNCTION IF EXISTS token_economy.update_token_balance();
DROP FUNCTION IF EXISTS token_economy.get_user_token_data(TEXT);

-- Try to delete the admin user if it exists
DELETE FROM token_economy.user_token_balances WHERE user_id = 'admin';

-- Alter tables to change TEXT columns to UUID
-- user_token_balances
ALTER TABLE token_economy.user_token_balances 
  ALTER COLUMN user_id TYPE UUID USING 
    CASE WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN user_id::uuid 
         ELSE NULL 
    END;

-- token_transactions
ALTER TABLE token_economy.token_transactions 
  ALTER COLUMN user_id TYPE UUID USING 
    CASE WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN user_id::uuid 
         ELSE NULL 
    END;

ALTER TABLE token_economy.token_transactions 
  ALTER COLUMN recipient_id TYPE UUID USING 
    CASE WHEN recipient_id IS NULL OR recipient_id = '' 
         THEN NULL 
         WHEN recipient_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN recipient_id::uuid 
         ELSE NULL 
    END;

ALTER TABLE token_economy.token_transactions 
  ALTER COLUMN story_id TYPE UUID USING 
    CASE WHEN story_id IS NULL OR story_id = '' 
         THEN NULL 
         WHEN story_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN story_id::uuid 
         ELSE NULL 
    END;

-- story_token_data
ALTER TABLE token_economy.story_token_data 
  ALTER COLUMN story_id TYPE UUID USING 
    CASE WHEN story_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN story_id::uuid 
         ELSE NULL 
    END;

ALTER TABLE token_economy.story_token_data 
  ALTER COLUMN creator_id TYPE UUID USING 
    CASE WHEN creator_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN creator_id::uuid 
         ELSE NULL 
    END;

-- nft_collections
ALTER TABLE token_economy.nft_collections 
  ALTER COLUMN creator_id TYPE UUID USING 
    CASE WHEN creator_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN creator_id::uuid 
         ELSE NULL 
    END;

-- nft_items
ALTER TABLE token_economy.nft_items 
  ALTER COLUMN owner_id TYPE UUID USING 
    CASE WHEN owner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN owner_id::uuid 
         ELSE NULL 
    END;

ALTER TABLE token_economy.nft_items 
  ALTER COLUMN creator_id TYPE UUID USING 
    CASE WHEN creator_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN creator_id::uuid 
         ELSE NULL 
    END;

ALTER TABLE token_economy.nft_items 
  ALTER COLUMN story_id TYPE UUID USING 
    CASE WHEN story_id IS NULL OR story_id = '' 
         THEN NULL 
         WHEN story_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN story_id::uuid 
         ELSE NULL 
    END;

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

-- Insert a new admin user with a valid UUID
INSERT INTO token_economy.user_token_balances (user_id, balance, lifetime_earned)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 1000, 1000)
ON CONFLICT DO NOTHING;
