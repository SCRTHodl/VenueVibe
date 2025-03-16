-- Migration for token_economy public views
-- Creates views in the public schema that expose token_economy tables

-- View for promotion settings
create or replace view public.promotion_settings as
  select * from token_economy.promotion_settings;

-- Set view ownership and add comment
alter view public.promotion_settings owner to postgres;
comment on view public.promotion_settings is 'Public view of token_economy.promotion_settings';

-- View for user token balances
create or replace view public.user_token_balances as
  select * from token_economy.user_token_balances;
  
-- Set view ownership and add comment
alter view public.user_token_balances owner to postgres;
comment on view public.user_token_balances is 'Public view of token_economy.user_token_balances';

-- View for token transactions
create or replace view public.token_transactions as
  select * from token_economy.token_transactions;
  
-- Set view ownership and add comment
alter view public.token_transactions owner to postgres;
comment on view public.token_transactions is 'Public view of token_economy.token_transactions';
