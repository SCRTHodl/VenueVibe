-- Drop existing policies that may be causing recursion
DO $$ 
BEGIN
  -- Drop admin panel policies
  DROP POLICY IF EXISTS "admin_panel_users_access_policy_v4" ON admin_panel.users;
  DROP POLICY IF EXISTS "admin_panel_users_access_policy_v3" ON admin_panel.users;
  DROP POLICY IF EXISTS "admin_panel_users_access_policy_v2" ON admin_panel.users;
  DROP POLICY IF EXISTS "admin_panel_users_access_policy_v1" ON admin_panel.users;
  DROP POLICY IF EXISTS "admin_users_access_policy" ON admin_panel.users;
  
  -- Drop AI instructions policies
  DROP POLICY IF EXISTS "Admins can manage AI instructions" ON ai_instructions;
  DROP POLICY IF EXISTS "Anyone can view AI instructions" ON ai_instructions;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM admin_panel.users 
    WHERE id = user_id 
    AND role = 'admin'
  );
$$;

-- Create function to check moderator status without recursion
CREATE OR REPLACE FUNCTION is_moderator(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM admin_panel.users 
    WHERE id = user_id 
    AND role IN ('admin', 'moderator')
  );
$$;

-- Create new admin panel policies without recursion
CREATE POLICY "admin_panel_users_select_v1"
  ON admin_panel.users
  FOR SELECT
  TO authenticated
  USING (is_moderator(auth.uid()));

CREATE POLICY "admin_panel_users_insert_v1"
  ON admin_panel.users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_panel_users_update_v1"
  ON admin_panel.users
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_panel_users_delete_v1"
  ON admin_panel.users
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create new AI instructions policies without recursion
CREATE POLICY "ai_instructions_select_v1"
  ON ai_instructions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "ai_instructions_insert_v1"
  ON ai_instructions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "ai_instructions_update_v1"
  ON ai_instructions
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "ai_instructions_delete_v1"
  ON ai_instructions
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_moderator TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_role 
  ON admin_panel.users(role);

CREATE INDEX IF NOT EXISTS idx_ai_instructions_active 
  ON ai_instructions(invite_code)
  WHERE invite_code IS NOT NULL;