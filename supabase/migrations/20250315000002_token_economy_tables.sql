-- Migration for token_economy tables
-- Creates all necessary tables for the token economy system

-- Create promotion_settings table
create table if not exists token_economy.promotion_settings (
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

-- Create user_token_balances table
create table if not exists token_economy.user_token_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  balance integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create token_transactions table
create table if not exists token_economy.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount integer not null,
  transaction_type text not null,
  description text,
  reference_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
