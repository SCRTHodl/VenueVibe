/*
  # Add private groups support
  
  1. New Tables
    - `private_groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `latitude` (float8)
      - `longitude` (float8)
      - `invite_code` (text, unique)
      - `creator_id` (uuid, references auth.users)
      - `max_participants` (int)
      - `current_participants` (int)
      - `meeting_time` (text)
      - `category` (text)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for creator access
    - Add policies for invited users
*/

-- Create private groups table
CREATE TABLE IF NOT EXISTS private_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  invite_code text UNIQUE NOT NULL,
  creator_id uuid REFERENCES auth.users(id),
  max_participants int DEFAULT 20,
  current_participants int DEFAULT 0,
  meeting_time text,
  category text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Enable RLS
ALTER TABLE private_groups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Creators can manage their private groups"
  ON private_groups
  FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Anyone with invite code can view private groups"
  ON private_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_private_groups_invite_code 
  ON private_groups(invite_code);

CREATE INDEX IF NOT EXISTS idx_private_groups_creator 
  ON private_groups(creator_id);

-- Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code text := '';
  i integer := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    IF NOT EXISTS (SELECT 1 FROM private_groups WHERE invite_code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Add trigger to automatically generate invite code
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_unique_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invite_code_trigger
BEFORE INSERT ON private_groups
FOR EACH ROW
EXECUTE FUNCTION set_invite_code();