-- Create new token economy tables in public schema with te_ prefix

-- te_promotion_settings table
CREATE TABLE te_promotion_settings (
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

-- te_user_token_balances table
CREATE TABLE te_user_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- te_token_transactions table
CREATE TABLE te_token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE te_promotion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE te_user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE te_token_transactions ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "read_promotion_settings" ON te_promotion_settings FOR SELECT USING (true);

CREATE POLICY "admin_manage_promotion_settings" ON te_promotion_settings 
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "read_own_token_balance" ON te_user_token_balances 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admin_manage_token_balances" ON te_user_token_balances 
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "read_own_transactions" ON te_token_transactions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admin_manage_transactions" ON te_token_transactions 
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));
