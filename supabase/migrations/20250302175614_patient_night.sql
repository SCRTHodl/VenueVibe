-- Create admin panel schema
CREATE SCHEMA IF NOT EXISTS admin_panel;

-- Create admin users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_panel.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'analyst')),
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

-- Create unique policies with new names
CREATE POLICY "admin_panel_users_access_v1"
  ON admin_panel.users
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_panel.users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_panel.users WHERE role = 'admin'));

CREATE POLICY "admin_panel_activity_view_v1"
  ON admin_panel.activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_panel.users));

CREATE POLICY "admin_panel_activity_insert_v1"
  ON admin_panel.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_panel.users));

CREATE POLICY "admin_panel_settings_access_v1"
  ON admin_panel.settings
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_panel.users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_panel.users WHERE role = 'admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_activity_log 
  ON admin_panel.activity_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key 
  ON admin_panel.settings(key);

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
  -- Verify admin status
  IF NOT EXISTS (
    SELECT 1 FROM admin_panel.users 
    WHERE id = auth.uid()
  ) THEN
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

-- Create function to update admin settings
CREATE OR REPLACE FUNCTION admin_panel.update_setting(
  p_key text,
  p_value jsonb,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin status
  IF NOT EXISTS (
    SELECT 1 FROM admin_panel.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update or insert setting
  INSERT INTO admin_panel.settings (
    key,
    value,
    description,
    updated_by,
    updated_at
  ) VALUES (
    p_key,
    p_value,
    p_description,
    auth.uid(),
    now()
  )
  ON CONFLICT (key) DO UPDATE
  SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_by = EXCLUDED.updated_by,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Create function to get admin settings
CREATE OR REPLACE FUNCTION admin_panel.get_settings(p_keys text[] DEFAULT NULL)
RETURNS TABLE (
  key text,
  value jsonb,
  description text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.key,
    s.value,
    s.description,
    s.updated_at
  FROM admin_panel.settings s
  WHERE 
    p_keys IS NULL OR 
    s.key = ANY(p_keys);
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA admin_panel TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA admin_panel TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA admin_panel TO authenticated;

-- Insert default settings
INSERT INTO admin_panel.settings (key, value, description) VALUES
  (
    'content_moderation',
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
ON CONFLICT DO NOTHING;