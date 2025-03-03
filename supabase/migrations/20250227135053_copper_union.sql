/*
  # Add Invite Code and Event Theme Support

  1. New Tables
    - `event_themes` - Stores theme configurations for special events
    - `invite_codes` - Stores invitation codes for events, groups, and specials
    - `user_settings` - Stores user preferences and active theme/codes
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authorized access
*/

-- Create table for event themes
CREATE TABLE IF NOT EXISTS event_themes (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  primary_color text NOT NULL,
  secondary_color text NOT NULL,
  accent_color text NOT NULL,
  logo_url text,
  banner_url text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_themes ENABLE ROW LEVEL SECURITY;

-- Create policy for reading event themes
CREATE POLICY "Anyone can read event themes"
  ON event_themes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create table for invite codes
CREATE TABLE IF NOT EXISTS invite_codes (
  code text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('event', 'group', 'special')),
  target_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expire_at timestamptz,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  theme_id text REFERENCES event_themes(id)
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for reading invite codes
CREATE POLICY "Anyone can read invite codes"
  ON invite_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policy for creating invite codes (authenticated only)
CREATE POLICY "Authenticated users can create invite codes"
  ON invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create table for user settings and active themes
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  active_theme text REFERENCES event_themes(id),
  active_event_code text REFERENCES invite_codes(code),
  joined_events jsonb DEFAULT '[]'::jsonb,
  joined_groups jsonb DEFAULT '[]'::jsonb,
  preferences jsonb DEFAULT '{"notifications": true, "location": true, "darkMode": true}'::jsonb,
  last_active timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own settings
CREATE POLICY "Users can read their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy for users to update their own settings
CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create table for user invitations
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code text REFERENCES invite_codes(code),
  invited_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz DEFAULT now(),
  expire_at timestamptz DEFAULT (now() + interval '7 days'),
  is_event boolean DEFAULT false,
  event_id text,
  group_id text
);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing invitations
CREATE POLICY "Anyone can view invitations"
  ON user_invitations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policy for accepting invitations
CREATE POLICY "Anyone can accept invitations"
  ON user_invitations
  FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending' AND expire_at > now())
  WITH CHECK (status = 'accepted');

-- Insert default event themes (for demo purposes)
INSERT INTO event_themes (id, name, description, primary_color, secondary_color, accent_color, is_active)
VALUES 
  ('spring-training', 'Spring Training', 'Special baseball spring training events and activities', '#1E88E5', '#004D98', '#FF6B00', true),
  ('first-friday', 'First Friday Art Walk', 'Downtown Phoenix art walk featuring galleries and street vendors', '#6A1B9A', '#38006B', '#F06292', false),
  ('suns-playoff', 'Suns Playoff Run', 'Playoff basketball activities and watch parties', '#FF9800', '#7A0019', '#E65100', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample invite codes (for demo purposes)
INSERT INTO invite_codes (code, type, target_id, theme_id)
VALUES 
  ('SPRING2025', 'event', 'spring-training', 'spring-training'),
  ('ART2025', 'event', 'first-friday', 'first-friday'),
  ('SUNS2025', 'event', 'suns-playoff', 'suns-playoff')
ON CONFLICT (code) DO NOTHING;