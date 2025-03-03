-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for digital_items
  DROP POLICY IF EXISTS "Anyone can view digital items" ON digital_items;
  
  -- Drop policies for user_items
  DROP POLICY IF EXISTS "Users can view their own items" ON user_items;
  DROP POLICY IF EXISTS "Users can insert their own items" ON user_items;
  
  -- Drop policies for token_rewards
  DROP POLICY IF EXISTS "Anyone can view token rewards" ON token_rewards;
  
  -- Drop policies for content_interactions
  DROP POLICY IF EXISTS "Anyone can view content interactions" ON content_interactions;
  DROP POLICY IF EXISTS "Users can insert their own interactions" ON content_interactions;
  
  -- Drop policies for user_wallets
  DROP POLICY IF EXISTS "Users can view their own wallet" ON user_wallets;
  
  -- Drop policies for token_transactions
  DROP POLICY IF EXISTS "Users can view their own transactions" ON token_transactions;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS digital_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  price integer NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('nft', 'gift', 'badge', 'theme')),
  rarity text NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  supply integer,
  remaining integer,
  transferable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  item_id uuid REFERENCES digital_items(id),
  quantity integer DEFAULT 1,
  purchased_at timestamptz DEFAULT now(),
  is_equipped boolean DEFAULT false,
  token_id text
);

CREATE TABLE IF NOT EXISTS token_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  token_amount integer NOT NULL,
  cooldown_seconds integer DEFAULT 86400,
  max_daily integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('post', 'story', 'comment', 'profile')),
  content_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'share', 'badge', 'tip')),
  badge_type text,
  token_amount integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  balance integer DEFAULT 0 NOT NULL,
  total_earned integer DEFAULT 0 NOT NULL,
  total_spent integer DEFAULT 0 NOT NULL,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('earn', 'spend', 'purchase', 'transfer', 'reward')),
  amount integer NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_interactions_content 
  ON content_interactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_user 
  ON content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user
  ON token_transactions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE digital_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view digital items"
  ON digital_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can view their own items"
  ON user_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own items"
  ON user_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view token rewards"
  ON token_rewards FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view content interactions"
  ON content_interactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert their own interactions"
  ON content_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own wallet"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create helper functions
CREATE OR REPLACE FUNCTION update_token_balance(
  user_id uuid,
  amount_change integer,
  is_spend boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  wallet_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_wallets WHERE user_id = update_token_balance.user_id
  ) INTO wallet_exists;
  
  IF NOT wallet_exists THEN
    INSERT INTO user_wallets (user_id, balance, total_earned, total_spent)
    VALUES (update_token_balance.user_id, 0, 0, 0);
  END IF;
  
  IF is_spend THEN
    UPDATE user_wallets
    SET 
      balance = balance - amount_change,
      total_spent = total_spent + amount_change,
      updated_at = now()
    WHERE user_id = update_token_balance.user_id;
  ELSE
    UPDATE user_wallets
    SET 
      balance = balance + amount_change,
      total_earned = total_earned + amount_change,
      updated_at = now()
    WHERE user_id = update_token_balance.user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION reward_content_interaction(
  content_type text,
  content_id text,
  user_id uuid,
  interaction_type text,
  token_amount integer DEFAULT NULL,
  badge_type text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_interaction_id uuid;
  content_owner_id uuid;
  reward_amount integer;
BEGIN
  INSERT INTO content_interactions (
    content_type, content_id, user_id, interaction_type, badge_type, token_amount
  )
  VALUES (
    content_type, content_id, user_id, interaction_type, badge_type, 
    COALESCE(token_amount, 0)
  )
  RETURNING id INTO new_interaction_id;
  
  IF interaction_type = 'tip' AND token_amount > 0 THEN
    PERFORM update_token_balance(user_id, token_amount, true);
    
    SELECT owner_id INTO content_owner_id
    FROM (
      SELECT user_id as owner_id FROM posts WHERE id = content_id
      UNION ALL
      SELECT user_id as owner_id FROM stories WHERE id = content_id
    ) AS content_owners;
    
    IF content_owner_id IS NOT NULL THEN
      PERFORM update_token_balance(content_owner_id, token_amount, false);
      
      INSERT INTO token_transactions (
        user_id, type, amount, reason, metadata
      )
      VALUES (
        content_owner_id, 'earn', token_amount, 
        'Received tip', 
        jsonb_build_object(
          'contentType', content_type,
          'contentId', content_id,
          'fromUserId', user_id
        )
      );
    END IF;
  END IF;
  
  IF interaction_type IN ('like', 'share', 'badge') THEN
    SELECT token_amount INTO reward_amount
    FROM token_rewards
    WHERE action_type = interaction_type
    LIMIT 1;
    
    IF reward_amount > 0 THEN
      SELECT owner_id INTO content_owner_id
      FROM (
        SELECT user_id as owner_id FROM posts WHERE id = content_id
        UNION ALL
        SELECT user_id as owner_id FROM stories WHERE id = content_id
      ) AS content_owners;
      
      IF content_owner_id IS NOT NULL AND content_owner_id != user_id THEN
        PERFORM update_token_balance(content_owner_id, reward_amount, false);
        
        INSERT INTO token_transactions (
          user_id, type, amount, reason, metadata
        )
        VALUES (
          content_owner_id, 'reward', reward_amount, 
          'Content ' || interaction_type, 
          jsonb_build_object(
            'contentType', content_type,
            'contentId', content_id,
            'interactionId', new_interaction_id
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN new_interaction_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_token_balance TO authenticated;
GRANT EXECUTE ON FUNCTION reward_content_interaction TO authenticated;

-- Insert default token rewards
INSERT INTO token_rewards (action_type, token_amount, cooldown_seconds, max_daily)
VALUES 
  ('post', 5, 3600, 50),
  ('story', 3, 3600, 30),
  ('like', 1, 86400, 100),
  ('share', 5, 86400, 25),
  ('badge', 10, 86400, 10),
  ('comment', 2, 3600, 50),
  ('daily_login', 10, 86400, 1),
  ('invite', 20, 0, 100)
ON CONFLICT DO NOTHING;

-- Insert sample digital items
INSERT INTO digital_items (name, description, image_url, price, item_type, rarity, supply, remaining)
VALUES 
  ('Super Badge', 'Award this special badge to amazing content', 'https://images.unsplash.com/photo-1647427060118-4911c9821b82?w=200&h=200&fit=crop', 25, 'badge', 'uncommon', 1000, 1000),
  ('Golden Trophy', 'A prestigious award for the best content creators', 'https://images.unsplash.com/photo-1630396592737-a27cea5557f9?w=200&h=200&fit=crop', 100, 'badge', 'rare', 500, 500),
  ('Party Gift', 'Send a virtual party to someone special', 'https://images.unsplash.com/photo-1597517697687-364ba1cf8246?w=200&h=200&fit=crop', 15, 'gift', 'common', 10000, 10000),
  ('VIP Pass', 'Give someone special access to your VIP content', 'https://images.unsplash.com/photo-1549638766-0a06b2ae05e4?w=200&h=200&fit=crop', 50, 'gift', 'epic', 250, 250),
  ('Mystery Box', 'A surprise gift with random rewards', 'https://images.unsplash.com/photo-1575505586569-bf2be4938266?w=200&h=200&fit=crop', 35, 'gift', 'uncommon', 2000, 2000),
  ('Phoenix Theme', 'Exclusive app theme with fire gradients', 'https://images.unsplash.com/photo-1616235131438-fc63be3e305b?w=200&h=200&fit=crop', 75, 'theme', 'epic', 100, 100),
  ('Midnight NFT', 'Limited edition digital collectible', 'https://images.unsplash.com/photo-1578380573599-0d2885c95a6b?w=200&h=200&fit=crop', 250, 'nft', 'legendary', 10, 10),
  ('Space Explorer NFT', 'Commemorating the MapChat space expedition', 'https://images.unsplash.com/photo-1590907047706-ee947775cc9e?w=200&h=200&fit=crop', 350, 'nft', 'legendary', 5, 5)
ON CONFLICT DO NOTHING;