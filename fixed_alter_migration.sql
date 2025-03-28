-- Alter tables to fix type mismatches
-- This script modifies existing tables to use UUID types consistently

-- First drop existing policies that use auth.uid() without casting
DROP POLICY IF EXISTS "Users can view their own token balance" ON token_economy.user_token_balances;
DROP POLICY IF EXISTS "Users can view their own transactions" ON token_economy.token_transactions;
DROP POLICY IF EXISTS read_own_token_balance ON token_economy.user_token_balances;
DROP POLICY IF EXISTS read_own_transactions ON token_economy.token_transactions;
DROP POLICY IF EXISTS update_own_story_token_data ON token_economy.story_token_data;
DROP POLICY IF EXISTS update_own_nft_items ON token_economy.nft_items;
DROP POLICY IF EXISTS read_own_content_access ON token_economy.content_access;

-- Now recreate policies with proper casting
CREATE POLICY read_own_token_balance ON token_economy.user_token_balances
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY read_own_transactions ON token_economy.token_transactions
  FOR SELECT USING (auth.uid()::uuid = user_id OR auth.uid()::uuid = recipient_id);

CREATE POLICY read_story_token_data ON token_economy.story_token_data
  FOR SELECT USING (true);

CREATE POLICY update_own_story_token_data ON token_economy.story_token_data
  FOR UPDATE USING (auth.uid()::uuid = creator_id);

CREATE POLICY read_nft_collections ON token_economy.nft_collections
  FOR SELECT USING (true);

CREATE POLICY read_nft_items ON token_economy.nft_items
  FOR SELECT USING (true);

CREATE POLICY update_own_nft_items ON token_economy.nft_items
  FOR UPDATE USING (auth.uid()::uuid = owner_id);

-- Content access policies if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'token_economy' AND table_name = 'content_access') THEN
    EXECUTE 'CREATE POLICY read_own_content_access ON token_economy.content_access
      FOR SELECT USING (auth.uid()::uuid = user_id)';
  END IF;
END $$;

-- Add secure admin functions

-- Remove broad admin update policy and replace with specific function-based access
-- Drop existing policy first if it exists
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

-- Function to update user status with logging
CREATE OR REPLACE FUNCTION public.update_user_status(
  p_user_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Check if user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Admin access required';
  END IF;
  
  -- Get admin ID
  SELECT auth.uid() INTO v_admin_id;
  
  -- Update user status
  UPDATE public.users
  SET 
    status = p_status,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Log the action
  INSERT INTO public.moderation_actions (
    target_id, target_type, action, admin_id, notes, created_at
  ) VALUES (
    p_user_id, 'user', 'status_change', v_admin_id, 
    format('Changed status to %s. Reason: %s', p_status, COALESCE(p_reason, 'Not provided')),
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update settings with audit log
CREATE OR REPLACE FUNCTION public.update_setting(
  p_key TEXT,
  p_value JSONB,
  p_description TEXT
)
RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
  v_action TEXT;
BEGIN
  -- Check if user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Admin access required';
  END IF;
  
  -- Get admin ID
  SELECT auth.uid() INTO v_admin_id;
  
  -- Determine if this is an insert or update
  SELECT CASE WHEN EXISTS (SELECT 1 FROM public.settings WHERE key = p_key) THEN 'update' ELSE 'insert' END INTO v_action;
  
  -- Update or insert the setting
  INSERT INTO public.settings (key, value, description, created_at, updated_at)
  VALUES (p_key, p_value, p_description, now(), now())
  ON CONFLICT (key) 
  DO UPDATE SET value = p_value, description = p_description, updated_at = now();
  
  -- Log the action
  INSERT INTO public.moderation_actions (
    target_id, target_type, action, admin_id, notes, created_at
  ) VALUES (
    gen_random_uuid(), 'setting', v_action, v_admin_id, 
    format('Setting %s: %s', p_key, p_value::text),
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to manage promotional content
CREATE OR REPLACE FUNCTION public.manage_promotional_content(
  p_content_id UUID,
  p_action TEXT, -- 'approve', 'reject', 'feature'
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Check if user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Admin access required';
  END IF;
  
  -- Get admin ID
  SELECT auth.uid() INTO v_admin_id;
  
  -- Log the action
  INSERT INTO public.moderation_actions (
    target_id, target_type, action, admin_id, notes, created_at
  ) VALUES (
    p_content_id, 'promotional_content', p_action, v_admin_id, 
    p_notes,
    now()
  );
  
  -- Future: Add actual implementation to update promotional content tables
  -- This will depend on the structure of your promotional content tables
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to manage user roles (e.g., grant/revoke admin)
CREATE OR REPLACE FUNCTION public.manage_user_role(
  p_user_id UUID,
  p_is_admin BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Check if user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Admin access required';
  END IF;
  
  -- Get admin ID
  SELECT auth.uid() INTO v_admin_id;
  
  -- Update user role
  UPDATE public.users
  SET 
    is_admin = p_is_admin,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Log the action
  INSERT INTO public.moderation_actions (
    target_id, target_type, action, admin_id, notes, created_at
  ) VALUES (
    p_user_id, 'user', 'role_change', v_admin_id, 
    format('Set admin status to %s. Reason: %s', p_is_admin, COALESCE(p_reason, 'Not provided')),
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check and fix function
DO $$ 
BEGIN
  -- Drop the function if it exists
  DROP FUNCTION IF EXISTS token_economy.get_user_token_data(UUID);
  
  -- Recreate with explicit UUID casting
  CREATE OR REPLACE FUNCTION token_economy.get_user_token_data(p_user_id UUID)
  RETURNS TABLE (
    balance INTEGER,
    lifetime_earned INTEGER,
    lifetime_spent INTEGER,
    stories_count BIGINT,
    nfts_count BIGINT
  ) LANGUAGE plpgsql AS $$
  BEGIN
    RETURN QUERY
    SELECT
      utb.balance,
      utb.lifetime_earned,
      utb.lifetime_spent,
      COUNT(DISTINCT std.story_id)::BIGINT,
      COUNT(DISTINCT ni.id)::BIGINT
    FROM token_economy.user_token_balances utb
    LEFT JOIN token_economy.story_token_data std ON std.creator_id = p_user_id
    LEFT JOIN token_economy.nft_items ni ON ni.owner_id = p_user_id
    WHERE utb.user_id = p_user_id
    GROUP BY utb.balance, utb.lifetime_earned, utb.lifetime_spent;
  END;
  $$;
END $$;
