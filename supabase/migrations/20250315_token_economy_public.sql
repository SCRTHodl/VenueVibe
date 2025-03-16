-- Migration for token economy system using public schema
-- This approach simplifies database access and avoids schema-related issues

-- 1. Create utility functions
create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Create token economy tables in public schema with te_ prefix
create table if not exists te_promotion_settings (
  id bigint primary key,
  is_enabled boolean default false,
  token_reward integer default 50,
  theme jsonb,
  moderation_keywords jsonb,
  content_focus text default 'General',
  promotional_boxes jsonb,
  special_offer text,
  custom_banner_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists te_user_token_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  balance integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists te_token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount integer not null,
  transaction_type text not null,
  description text,
  reference_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Enable RLS for all token economy tables
alter table te_promotion_settings enable row level security;
alter table te_user_token_balances enable row level security;
alter table te_token_transactions enable row level security;

-- 4. Create policy for reading promotion settings (visible to all authenticated users)
drop policy if exists promotion_settings_select on te_promotion_settings;
create policy promotion_settings_select 
  on te_promotion_settings for select 
  to authenticated using (true);

-- 5. Create policy for updating promotion settings (only admin users)
drop policy if exists promotion_settings_update on te_promotion_settings;
create policy promotion_settings_update 
  on te_promotion_settings for update 
  to authenticated 
  using (exists (select 1 from users where id = auth.uid() and is_admin = true));

-- 6. Create policy for users to read their own token balances
drop policy if exists user_token_balances_select on te_user_token_balances;
create policy user_token_balances_select 
  on te_user_token_balances for select 
  to authenticated 
  using (auth.uid() = user_id);

-- 7. Create policy for admins to read any token balance
drop policy if exists user_token_balances_admin_select on te_user_token_balances;
create policy user_token_balances_admin_select 
  on te_user_token_balances for select 
  to authenticated 
  using (exists (select 1 from users where id = auth.uid() and is_admin = true));

-- 8. Create policy for users to update their own token balances
drop policy if exists user_token_balances_update on te_user_token_balances;
create policy user_token_balances_update 
  on te_user_token_balances for update 
  to authenticated 
  using (auth.uid() = user_id);

-- 9. Create policy for users to read their own transactions
drop policy if exists token_transactions_select_own on te_token_transactions;
create policy token_transactions_select_own 
  on te_token_transactions for select 
  to authenticated 
  using (auth.uid() = user_id);

-- 10. Create policy for admins to read any transactions
drop policy if exists token_transactions_admin_select on te_token_transactions;
create policy token_transactions_admin_select 
  on te_token_transactions for select 
  to authenticated 
  using (exists (select 1 from users where id = auth.uid() and is_admin = true));

-- 11. Set up triggers for timestamp updates
drop trigger if exists te_user_token_balances_update_timestamp on te_user_token_balances;
create trigger te_user_token_balances_update_timestamp
  before update on te_user_token_balances
  for each row
  execute function update_timestamp();

drop trigger if exists te_promotion_settings_update_timestamp on te_promotion_settings;
create trigger te_promotion_settings_update_timestamp
  before update on te_promotion_settings
  for each row
  execute function update_timestamp();

drop trigger if exists te_token_transactions_update_timestamp on te_token_transactions;
create trigger te_token_transactions_update_timestamp
  before update on te_token_transactions
  for each row
  execute function update_timestamp();

-- 12. Create function for granting free refresh tokens
create or replace function grant_free_refresh_tokens(
  p_user_id uuid,
  p_token_count integer default 10
) returns boolean as $$
declare
  v_user_balance_id uuid;
begin
  -- Check if user exists
  if not exists (select 1 from auth.users where id = p_user_id) then
    return false;
  end if;
  
  -- Find or create user balance record
  select id into v_user_balance_id from te_user_token_balances where user_id = p_user_id;
  
  if v_user_balance_id is null then
    -- Create new balance record
    insert into te_user_token_balances (user_id, balance)
    values (p_user_id, p_token_count)
    returning id into v_user_balance_id;
  else
    -- Update existing balance
    update te_user_token_balances
    set balance = balance + p_token_count
    where id = v_user_balance_id;
  end if;
  
  -- Record the transaction
  insert into te_token_transactions (
    user_id, 
    amount, 
    transaction_type, 
    description
  ) values (
    p_user_id,
    p_token_count,
    'REFRESH',
    'Daily free token refresh'
  );
  
  return true;
end;
$$ language plpgsql security definer;
