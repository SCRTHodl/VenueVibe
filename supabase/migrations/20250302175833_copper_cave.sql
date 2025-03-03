-- Create admin panel schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS admin_panel;

-- Create admin roles enum
CREATE TYPE admin_panel.role_type AS ENUM ('admin', 'moderator', 'analyst');

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_panel.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role admin_panel.role_type NOT NULL,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Create admin activity log
CREATE TABLE IF NOT EXISTS admin_panel.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_panel.users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create admin settings table
CREATE TABLE IF NOT EXISTS admin_panel.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES admin_panel.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_panel.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel.settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "admin_users_access_policy"
  ON admin_panel.users
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_panel.users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_panel.users WHERE role = 'admin'));

CREATE POLICY "admin_activity_view_policy"
  ON admin_panel.activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_panel.users));

CREATE POLICY "admin_activity_insert_policy"
  ON admin_panel.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_panel.users));

CREATE POLICY "admin_settings_access_policy"
  ON admin_panel.settings
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

-- Create function to check moderator status
CREATE OR REPLACE FUNCTION admin_panel.is_moderator(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_panel.users
    WHERE id = p_user_id AND role IN ('admin', 'moderator')
  );
END;
$$;

-- Create function to log admin activity
CREATE OR REPLACE FUNCTION admin_panel.log_activity(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Verify admin/moderator status
  IF NOT admin_panel.is_moderator(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Log activity
  INSERT INTO admin_panel.activity_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Insert default settings
INSERT INTO admin_panel.settings (key, value, description) VALUES
  (
    'moderation',
    jsonb_build_object(
      'auto_moderation', true,
      'moderation_threshold', 0.8,
      'content_retention_days', 30,
      'notify_on_high_priority', true,
      'max_reports_before_review', 3
    ),
    'Content moderation settings'
  ),
  (
    'ai_assistant',
    jsonb_build_object(
      'name', 'Jessica',
      'personality', 'helpful and friendly',
      'capabilities', ARRAY['user_data_access', 'content_filtering', 'recommendations']
    ),
    'AI assistant configuration'
  )
ON CONFLICT (key) DO UPDATE
SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- Grant permissions
GRANT USAGE ON SCHEMA admin_panel TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA admin_panel TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA admin_panel TO authenticated;