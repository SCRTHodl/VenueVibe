/*
  # Update message table RLS policies
  
  1. Changes
    - Drop existing policies
    - Create new policies for both authenticated and guest users
    - Add proper security checks
  
  2. Security
    - Allow both authenticated and guest users to read messages
    - Allow authenticated users to send messages with their user_id
    - Allow guest users to send messages with guest_id and guest_name
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Messages read access policy" ON messages;
DROP POLICY IF EXISTS "Messages insert policy" ON messages;
DROP POLICY IF EXISTS "Enable message reading" ON messages;
DROP POLICY IF EXISTS "Enable message sending" ON messages;

-- Create new policies with proper checks
CREATE POLICY "Allow reading messages"
  ON messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow sending messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (
    -- For authenticated users: user_id must match auth.uid()
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND guest_id IS NULL AND guest_name IS NULL)
    OR
    -- For guest users: must provide both guest_id and guest_name
    (auth.uid() IS NULL AND guest_id IS NOT NULL AND guest_name IS NOT NULL AND user_id IS NULL)
  );

-- Create index for guest messages
CREATE INDEX IF NOT EXISTS idx_messages_guest_combined 
  ON messages(guest_id, guest_name)
  WHERE guest_id IS NOT NULL AND guest_name IS NOT NULL;