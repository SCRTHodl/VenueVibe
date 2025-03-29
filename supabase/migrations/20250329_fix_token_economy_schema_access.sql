-- Fix schema access issues and create public views for token economy

-- Ensure token_economy schema exists
CREATE SCHEMA IF NOT EXISTS token_economy;

-- Create user_token_balances table in public schema if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_token_balances (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create token_transactions table in public schema if it doesn't exist
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Enable RLS on token tables
ALTER TABLE public.user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for token tables
CREATE POLICY "Users can view their own token balance" 
  ON public.user_token_balances FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" 
  ON public.token_transactions FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = recipient_id);

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_token_balances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.token_transactions TO authenticated;

-- Create function to sync data between schemas if needed
CREATE OR REPLACE FUNCTION public.sync_token_data_to_token_economy()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync logic would go here if needed in the future
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
