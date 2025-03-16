-- Create views to expose token_economy tables to the public schema without requiring service role access
-- This allows regular applications to access token economy data with standard permissions

-- View for promotion settings
CREATE OR REPLACE VIEW public.promotion_settings AS
  SELECT * FROM token_economy.promotion_settings;

-- RLS policy for the view
ALTER VIEW public.promotion_settings OWNER TO postgres;
COMMENT ON VIEW public.promotion_settings IS 'Public view of token_economy.promotion_settings';

-- View for user token balances
CREATE OR REPLACE VIEW public.user_token_balances AS
  SELECT * FROM token_economy.user_token_balances;
  
-- RLS policy for the view
ALTER VIEW public.user_token_balances OWNER TO postgres;
COMMENT ON VIEW public.user_token_balances IS 'Public view of token_economy.user_token_balances';

-- View for token transactions
CREATE OR REPLACE VIEW public.token_transactions AS
  SELECT * FROM token_economy.token_transactions;
  
-- RLS policy for the view
ALTER VIEW public.token_transactions OWNER TO postgres;
COMMENT ON VIEW public.token_transactions IS 'Public view of token_economy.token_transactions';
