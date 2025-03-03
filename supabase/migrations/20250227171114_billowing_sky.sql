/*
  # Token Reward System and NFT Store

  1. New Tables
    - `digital_items` - NFTs and gift items that users can purchase
    - `user_items` - Junction table tracking which items users own
    - `token_rewards` - Configuration for token rewards from interactions
    - `content_interactions` - Track likes, shares, and badges on content
    - `user_wallets` - Enhanced wallet tracking for users
    - `token_transactions` - Record of all token transactions
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write appropriate data
    
  3. Functions
    - Create helper functions for token rewards
*/

-- Digital items table for NFTs and gifts
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

-- User owned items
CREATE TABLE IF NOT EXISTS user_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  item_id uuid REFERENCES digital_items(id),
  quantity integer DEFAULT 1,
  purchased_at timestamptz DEFAULT now(),
  is_equipped boolean DEFAULT false,
  token_id text -- For NFTs, store the token identifier
);

-- Token reward configuration
CREATE TABLE IF NOT EXISTS token_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  token_amount integer NOT NULL,
  cooldown_seconds integer DEFAULT 86400, -- Default 24 hour cooldown
  max_daily integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content interactions tracking
CREATE TABLE IF NOT EXISTS content_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('post', 'story', 'comment', 'profile')),
  content_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'share', 'badge', 'tip')),
  badge_type text, -- Only used for badge interactions
  token_amount integer DEFAULT 0, -- For tips or rewards
  created_at timestamptz DEFAULT now()
);

-- Create index on content interactions
CREATE INDEX IF NOT EXISTS idx_content_interactions_content 
  ON content_interactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_user 
  ON content_interactions(user_id);

-- Enhanced user wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  balance integer DEFAULT 0 NOT NULL,
  total_earned integer DEFAULT 0 NOT NULL,
  total_spent integer DEFAULT 0 NOT NULL,
  wallet_address text, -- For future blockchain integration
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Token transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('earn', 'spend', 'purchase', 'transfer', 'reward')),
  amount integer NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index on token transactions
CREATE INDEX IF NOT EXISTS idx_token_transactions_user
  ON token_transactions(user_id, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE digital_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Digital items policies
CREATE POLICY "Anyone can view digital items"
  ON digital_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- User items policies
CREATE POLICY "Users can view their own items"
  ON user_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own items"
  ON user_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Token rewards policies
CREATE POLICY "Anyone can view token rewards"
  ON token_rewards FOR SELECT
  TO anon, authenticated
  USING (true);

-- Content interactions policies
CREATE POLICY "Anyone can view content interactions"
  ON content_interactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert their own interactions"
  ON content_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User wallets policies
CREATE POLICY "Users can view their own wallet"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Token transactions policies
CREATE POLICY "Users can view their own transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Helper function to update token balance
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
  -- Check if wallet exists
  SELECT EXISTS (
    SELECT 1 FROM user_wallets WHERE user_id = update_token_balance.user_id
  ) INTO wallet_exists;
  
  -- Create wallet if it doesn't exist
  IF NOT wallet_exists THEN
    INSERT INTO user_wallets (user_id, balance, total_earned, total_spent)
    VALUES (update_token_balance.user_id, 0, 0, 0);
  END IF;
  
  -- Update wallet
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_token_balance TO authenticated;

-- Helper function to handle interaction rewards
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
  -- Insert the interaction
  INSERT INTO content_interactions (
    content_type, content_id, user_id, interaction_type, badge_type, token_amount
  )
  VALUES (
    content_type, content_id, user_id, interaction_type, badge_type, 
    COALESCE(token_amount, 0)
  )
  RETURNING id INTO new_interaction_id;
  
  -- If this is a tip, process the token transfer
  IF interaction_type = 'tip' AND token_amount > 0 THEN
    -- Deduct from the tipper
    PERFORM update_token_balance(user_id, token_amount, true);
    
    -- Add to content owner (if we can determine them - expand this logic as needed)
    -- This is just a placeholder, in real implementation you'd determine the content owner
    SELECT owner_id INTO content_owner_id
    FROM (
      SELECT user_id as owner_id FROM posts WHERE id = content_id
      UNION ALL
      SELECT user_id as owner_id FROM stories WHERE id = content_id
    ) AS content_owners;
    
    IF content_owner_id IS NOT NULL THEN
      PERFORM update_token_balance(content_owner_id, token_amount, false);
      
      -- Record the transaction for the recipient
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
  
  -- For other interaction types, determine reward from token_rewards table
  IF interaction_type IN ('like', 'share', 'badge') THEN
    SELECT token_amount INTO reward_amount
    FROM token_rewards
    WHERE action_type = interaction_type
    LIMIT 1;
    
    IF reward_amount > 0 THEN
      -- Add tokens to content owner for receiving the interaction
      -- Similar placeholder for determining content owner
      SELECT owner_id INTO content_owner_id
      FROM (
        SELECT user_id as owner_id FROM posts WHERE id = content_id
        UNION ALL
        SELECT user_id as owner_id FROM stories WHERE id = content_id
      ) AS content_owners;
      
      IF content_owner_id IS NOT NULL AND content_owner_id != user_id THEN
        PERFORM update_token_balance(content_owner_id, reward_amount, false);
        
        -- Record the transaction
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reward_content_interaction TO authenticated;

-- Insert default token rewards
INSERT INTO token_rewards (action_type, token_amount, cooldown_seconds, max_daily)
VALUES 
  ('post', 5, 3600, 50),         -- Create a post: 5 tokens, 1 hour cooldown, max 50/day
  ('story', 3, 3600, 30),        -- Create a story: 3 tokens, 1 hour cooldown, max 30/day
  ('like', 1, 86400, 100),       -- Receive a like: 1 token, 24 hour cooldown, max 100/day
  ('share', 5, 86400, 25),       -- Receive a share: 5 tokens, 24 hour cooldown, max 25/day
  ('badge', 10, 86400, 10),      -- Receive a badge: 10 tokens, 24 hour cooldown, max 10/day
  ('comment', 2, 3600, 50),      -- Create a comment: 2 tokens, 1 hour cooldown, max 50/day
  ('daily_login', 10, 86400, 1), -- Daily login: 10 tokens, 24 hour cooldown, max 1/day
  ('invite', 20, 0, 100);        -- Invite a friend: 20 tokens, no cooldown, max 100/day

-- Insert some example digital items
INSERT INTO digital_items (name, description, image_url, price, item_type, rarity, supply, remaining)
VALUES 
  ('Super Badge', 'Award this special badge to amazing content', 'https://images.unsplash.com/photo-1647427060118-4911c9821b82?w=200&h=200&fit=crop', 25, 'badge', 'uncommon', 1000, 1000),
  ('Golden Trophy', 'A prestigious award for the best content creators', 'https://images.unsplash.com/photo-1630396592737-a27cea5557f9?w=200&h=200&fit=crop', 100, 'badge', 'rare', 500, 500),
  ('Party Gift', 'Send a virtual party to someone special', 'https://images.unsplash.com/photo-1597517697687-364ba1cf8246?w=200&h=200&fit=crop', 15, 'gift', 'common', 10000, 10000),
  ('VIP Pass', 'Give someone special access to your VIP content', 'https://images.unsplash.com/photo-1549638766-0a06b2ae05e4?w=200&h=200&fit=crop', 50, 'gift', 'epic', 250, 250),
  ('Mystery Box', 'A surprise gift with random rewards', 'https://images.unsplash.com/photo-1575505586569-bf2be4938266?w=200&h=200&fit=crop', 35, 'gift', 'uncommon', 2000, 2000),
  ('Phoenix Theme', 'Exclusive app theme with fire gradients', 'https://images.unsplash.com/photo-1616235131438-fc63be3e305b?w=200&h=200&fit=crop', 75, 'theme', 'epic', 100, 100),
  ('Midnight NFT', 'Limited edition digital collectible', 'https://images.unsplash.com/photo-1578380573599-0d2885c95a6b?w=200&h=200&fit=crop', 250, 'nft', 'legendary', 10, 10),
  ('Space Explorer NFT', 'Commemorating the MapChat space expedition', 'https://images.unsplash.com/photo-1590907047706-ee947775cc9e?w=200&h=200&fit=crop', 350, 'nft', 'legendary', 5, 5);