-- Migration to move token economy tables to public schema with te_ prefix

-- Create tables in public schema
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

CREATE TABLE te_user_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE te_token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for new tables

-- te_promotion_settings policies
ALTER TABLE te_promotion_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to manage promotion settings" 
  ON te_promotion_settings
  FOR ALL 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Allow all users to view promotion settings" 
  ON te_promotion_settings
  FOR SELECT 
  TO authenticated
  USING (true);

-- te_user_token_balances policies
ALTER TABLE te_user_token_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own token balance" 
  ON te_user_token_balances
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all token balances" 
  ON te_user_token_balances
  FOR ALL 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- te_token_transactions policies
ALTER TABLE te_token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
  ON te_token_transactions
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all transactions" 
  ON te_token_transactions
  FOR ALL 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Copy data from token_economy schema to public schema (if the token_economy schema exists)
DO $$
BEGIN
  -- Check if token_economy schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'token_economy') THEN
    -- Copy promotion settings
    INSERT INTO public.te_promotion_settings
    SELECT * FROM token_economy.promotion_settings
    ON CONFLICT (id) DO NOTHING;
    
    -- Copy user token balances
    INSERT INTO public.te_user_token_balances (id, user_id, balance, created_at, updated_at)
    SELECT id, user_id, balance, created_at, updated_at 
    FROM token_economy.user_token_balances
    ON CONFLICT (id) DO NOTHING;
    
    -- Copy token transactions
    INSERT INTO public.te_token_transactions
    SELECT * FROM token_economy.token_transactions
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
