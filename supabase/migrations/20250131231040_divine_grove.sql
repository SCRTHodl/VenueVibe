/*
  # Add version tracking table

  1. New Tables
    - `app_version`
      - `id` (uuid, primary key)
      - `version` (text, not null)
      - `created_at` (timestamptz)
      - `notes` (text)

  2. Security
    - Enable RLS on `app_version` table
    - Add policy for authenticated users to read versions
    - Add policy for admins to create new versions
*/

-- Create version tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_version ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON app_version;
DROP POLICY IF EXISTS "Enable insert for admins only" ON app_version;

-- Create policies
CREATE POLICY "Enable read access for all users"
  ON app_version
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for admins only"
  ON app_version
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert initial version if table is empty
INSERT INTO app_version (version, notes)
SELECT '1.0.0', 'Initial release'
WHERE NOT EXISTS (SELECT 1 FROM app_version);