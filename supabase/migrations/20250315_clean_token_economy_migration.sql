-- Clean migration script for token economy tables to public schema
-- This uses Supabase-compatible SQL syntax

-- Create token economy tables in public schema with te_ prefix

-- 1. Promotion settings table
CREATE TABLE IF NOT EXISTS public.te_promotion_settings (
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

-- 2. User token balances table
CREATE TABLE IF NOT EXISTS public.te_user_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Token transactions table
CREATE TABLE IF NOT EXISTS public.te_token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.te_promotion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.te_user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.te_token_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for te_promotion_settings
CREATE POLICY "Read promotion settings for all users" 
  ON public.te_promotion_settings FOR SELECT 
  USING (true);

CREATE POLICY "Admin can manage promotion settings" 
  ON public.te_promotion_settings FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true));

-- Create RLS policies for te_user_token_balances
CREATE POLICY "Users can read their own token balance" 
  ON public.te_user_token_balances FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all token balances" 
  ON public.te_user_token_balances FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true));

-- Create RLS policies for te_token_transactions
CREATE POLICY "Users can read their own transactions" 
  ON public.te_token_transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all transactions" 
  ON public.te_token_transactions FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true));

-- Insert default promotion settings if none exist
INSERT INTO public.te_promotion_settings (id, is_enabled, token_reward, content_focus, promotional_boxes)
VALUES (
  1, 
  true, 
  50, 
  'General',
  '[
    {"name": "City", "image": "/images/stories/city.jpg"}, 
    {"name": "Night Life", "image": "/images/stories/nightlife.jpg"}, 
    {"name": "Summer", "image": "/images/stories/summer.jpg"}, 
    {"name": "Spring", "image": "/images/stories/spring.jpg"}, 
    {"name": "Fall", "image": "/images/stories/fall.jpg"}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
