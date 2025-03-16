-- Initial schema setup for the main tables
-- Create token_economy schema
CREATE SCHEMA IF NOT EXISTS token_economy;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create basic token tables
CREATE TABLE token_economy.user_token_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create simple policy
ALTER TABLE token_economy.user_token_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_token_balance ON token_economy.user_token_balances
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- Add initial user
INSERT INTO token_economy.user_token_balances (user_id, balance)
VALUES ('00000000-0000-0000-0000-000000000000', 1000)
ON CONFLICT DO NOTHING;
