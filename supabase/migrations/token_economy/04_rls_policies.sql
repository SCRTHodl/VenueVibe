-- Enable RLS for all tables
ALTER TABLE token_economy.promotion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_economy.token_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading promotion settings (visible to all authenticated users)
DROP POLICY IF EXISTS promotion_settings_select ON token_economy.promotion_settings;
CREATE POLICY promotion_settings_select 
  ON token_economy.promotion_settings FOR SELECT 
  TO authenticated USING (true);

-- Create policy for updating promotion settings (only admin users)
DROP POLICY IF EXISTS promotion_settings_update ON token_economy.promotion_settings;
CREATE POLICY promotion_settings_update 
  ON token_economy.promotion_settings FOR UPDATE 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Create policy for users to read their own token balances
DROP POLICY IF EXISTS user_token_balances_select ON token_economy.user_token_balances;
CREATE POLICY user_token_balances_select 
  ON token_economy.user_token_balances FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create policy for admins to read any token balance
DROP POLICY IF EXISTS user_token_balances_admin_select ON token_economy.user_token_balances;
CREATE POLICY user_token_balances_admin_select 
  ON token_economy.user_token_balances FOR SELECT 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Create policy for users to update their own token balances
DROP POLICY IF EXISTS user_token_balances_update ON token_economy.user_token_balances;
CREATE POLICY user_token_balances_update 
  ON token_economy.user_token_balances FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create policy for users to read their own transactions
DROP POLICY IF EXISTS token_transactions_select_own ON token_economy.token_transactions;
CREATE POLICY token_transactions_select_own 
  ON token_economy.token_transactions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create policy for admins to read any transactions
DROP POLICY IF EXISTS token_transactions_admin_select ON token_economy.token_transactions;
CREATE POLICY token_transactions_admin_select 
  ON token_economy.token_transactions FOR SELECT 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));
