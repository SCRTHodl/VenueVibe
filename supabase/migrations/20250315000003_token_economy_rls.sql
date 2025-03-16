-- Migration for token_economy RLS policies
-- Enables row level security and sets up access policies

-- Enable RLS for all tables
alter table token_economy.promotion_settings enable row level security;
alter table token_economy.user_token_balances enable row level security;
alter table token_economy.token_transactions enable row level security;

-- Create policy for reading promotion settings (visible to all authenticated users)
drop policy if exists promotion_settings_select on token_economy.promotion_settings;
create policy promotion_settings_select 
  on token_economy.promotion_settings for select 
  to authenticated using (true);

-- Create policy for updating promotion settings (only admin users)
drop policy if exists promotion_settings_update on token_economy.promotion_settings;
create policy promotion_settings_update 
  on token_economy.promotion_settings for update 
  to authenticated 
  using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));

-- Create policy for users to read their own token balances
drop policy if exists user_token_balances_select on token_economy.user_token_balances;
create policy user_token_balances_select 
  on token_economy.user_token_balances for select 
  to authenticated 
  using (auth.uid() = user_id);

-- Create policy for admins to read any token balance
drop policy if exists user_token_balances_admin_select on token_economy.user_token_balances;
create policy user_token_balances_admin_select 
  on token_economy.user_token_balances for select 
  to authenticated 
  using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));

-- Create policy for users to update their own token balances
drop policy if exists user_token_balances_update on token_economy.user_token_balances;
create policy user_token_balances_update 
  on token_economy.user_token_balances for update 
  to authenticated 
  using (auth.uid() = user_id);

-- Create policy for users to read their own transactions
drop policy if exists token_transactions_select_own on token_economy.token_transactions;
create policy token_transactions_select_own 
  on token_economy.token_transactions for select 
  to authenticated 
  using (auth.uid() = user_id);

-- Create policy for admins to read any transactions
drop policy if exists token_transactions_admin_select on token_economy.token_transactions;
create policy token_transactions_admin_select 
  on token_economy.token_transactions for select 
  to authenticated 
  using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));
