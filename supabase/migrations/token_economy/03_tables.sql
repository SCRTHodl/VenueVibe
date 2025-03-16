-- Create token_economy.promotion_settings table
CREATE TABLE IF NOT EXISTS token_economy.promotion_settings (
  id BIGINT PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT FALSE,
  token_reward INTEGER DEFAULT 50,
  theme JSONB,
  moderation_keywords JSONB,
  content_focus TEXT DEFAULT 'General',
  promotional_boxes JSONB,
  special_offer TEXT,
  custom_banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create token_economy.user_token_balances table
CREATE TABLE IF NOT EXISTS token_economy.user_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create token_economy.token_transactions table
CREATE TABLE IF NOT EXISTS token_economy.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
