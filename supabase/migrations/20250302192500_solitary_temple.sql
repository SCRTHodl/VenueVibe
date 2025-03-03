-- Create admin panel schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS admin_panel;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "admin_users_access_policy" ON admin_panel.users;
  DROP POLICY IF EXISTS "admin_panel_users_access_policy_v1" ON admin_panel.users;
  DROP POLICY IF EXISTS "admin_panel_users_access_policy_v2" ON admin_panel.users;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create admin users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_panel.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'analyst')),
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_panel.users ENABLE ROW LEVEL SECURITY;

-- Create policy with unique name
CREATE POLICY "admin_panel_users_access_policy_v3"
  ON admin_panel.users
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_panel.users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_panel.users WHERE role = 'admin'));

-- Create function to check admin status
CREATE OR REPLACE FUNCTION admin_panel.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_panel.users
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA admin_panel TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA admin_panel TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA admin_panel TO authenticated;

-- Insert test admin user if not exists
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the first user as admin for testing
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO admin_panel.users (id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;