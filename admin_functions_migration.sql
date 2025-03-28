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
