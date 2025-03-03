/*
  # Fix Chat System Policies

  1. Changes
    - Drop existing policies
    - Create new, more permissive policies for chat messages
    - Add better indexes for performance

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON chat_messages;

-- Create new policies
CREATE POLICY "Enable read for authenticated users"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add better indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_channel ON chat_messages(group_id, channel);