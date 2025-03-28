-- =======================================
-- CLEAN ADMIN FUNCTIONALITY REDESIGN
-- =======================================

-- 1. First, ensure the public.users table exists with required fields
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the necessary admin tables in the public schema
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  action TEXT NOT NULL,
  admin_id UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- 4. Create helper function for admin checks
-- Use a direct connection to avoid RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Bypass RLS entirely by using a direct query
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create Row Level Security policies
-- Users table policies
CREATE POLICY "Users can view other users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Remove broad admin update policy and replace with specific function-based access
-- Admins should NOT directly update user records, but use admin functions instead

-- Settings table policies
CREATE POLICY "Anyone can view settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify settings" ON public.settings
  FOR ALL USING (public.is_admin());

-- Moderation actions policies
CREATE POLICY "Admins can view moderation actions" ON public.moderation_actions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create moderation actions" ON public.moderation_actions
  FOR INSERT WITH CHECK (public.is_admin());

-- 6. Create admin functions (moving from admin_panel schema to public)
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

-- Add additional admin functions for specialized operations

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

-- Function for moderation actions
CREATE OR REPLACE FUNCTION public.record_moderation_action(
  p_target_id UUID,
  p_target_type TEXT,
  p_action TEXT,
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
  
  -- Get the current user's ID
  v_admin_id := auth.uid();
  
  INSERT INTO public.moderation_actions (
    target_id,
    target_type,
    action,
    admin_id,
    notes,
    created_at
  ) VALUES (
    p_target_id,
    p_target_type,
    p_action,
    v_admin_id,
    p_notes,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a trigger to automatically add new auth users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Create backward compatibility functions for admin_panel schema
-- (This ensures existing code still works while you update it)
CREATE SCHEMA IF NOT EXISTS admin_panel;

CREATE OR REPLACE FUNCTION admin_panel.update_user_status(
  p_user_id UUID,
  p_status TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Forward to the new public function
  PERFORM public.update_user_status(p_user_id, p_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_panel.update_setting(
  p_key TEXT,
  p_value JSONB,
  p_description TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Forward to the new public function
  PERFORM public.update_setting(p_key, p_value, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_panel.record_moderation_action(
  p_target_id UUID,
  p_target_type TEXT,
  p_action TEXT,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Forward to the new public function
  PERFORM public.record_moderation_action(p_target_id, p_target_type, p_action, p_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create a view for backward compatibility
CREATE OR REPLACE VIEW admin_panel.settings AS
  SELECT * FROM public.settings;

-- 10. Migrate data if needed (ensure existing admin users are marked as admins)
UPDATE public.users
SET is_admin = true
FROM auth.users
WHERE public.users.id = auth.users.id 
AND auth.users.email = 'kaizencodesix@gmail.com';  -- Replace with your admin email

-- 11. Set admin rights for your user (replace with your actual user email)
UPDATE public.users
SET is_admin = true
WHERE email = 'kaizencodesix@gmail.com';  -- Replace with your admin email
