/*
  # Chat System Implementation

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `group_id` (text, references groups)
      - `user_id` (uuid, references auth.users)
      - `channel` (text)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for authenticated users to read and create messages
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL,
  user_id uuid REFERENCES auth.users,
  channel text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read messages
CREATE POLICY "Anyone can read messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert messages
CREATE POLICY "Authenticated users can insert messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS chat_messages_group_channel_idx ON chat_messages(group_id, channel);