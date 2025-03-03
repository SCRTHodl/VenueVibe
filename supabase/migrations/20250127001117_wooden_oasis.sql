/*
  # Add Update Subscribers Table

  1. New Tables
    - `update_subscribers`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `message` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `update_subscribers` table
    - Add policy for inserting new subscribers
    - Add policy for admins to read subscriber data
*/

CREATE TABLE IF NOT EXISTS update_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE update_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe
CREATE POLICY "Enable insert for all users"
  ON update_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only allow admins to read subscriber data
CREATE POLICY "Enable read access for admins only"
  ON update_subscribers
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');