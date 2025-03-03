/*
  # Fix chat messages table structure

  1. Changes
    - Drop and recreate chat_messages table with proper foreign key relationship
    - Update RLS policies
    - Add necessary indexes

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing table and its policies
DROP TABLE IF EXISTS chat_messages;

-- Recreate chat_messages table with proper structure
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  channel text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for authenticated users"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_channel ON chat_messages(group_id, channel);