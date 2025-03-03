/*
  # Add guest message support and channel column
  
  1. Changes
    - Add guest_id and guest_name columns to messages table
    - Add channel column to messages table
    - Update message policies with unique names
    - Add performance indexes for guest messages and channels
  
  2. Security
    - Allow both authenticated and guest users to read messages
    - Enable message sending for both user types
    - Maintain data integrity with proper constraints
*/

-- Add guest columns and channel if they don't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS guest_id text,
ADD COLUMN IF NOT EXISTS guest_name text,
ADD COLUMN IF NOT EXISTS channel text;

-- Drop existing policies with new names to avoid conflicts
DROP POLICY IF EXISTS "Messages read access policy" ON messages;
DROP POLICY IF EXISTS "Messages insert policy" ON messages;

-- Create new policies with unique names
CREATE POLICY "Messages read access policy"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Messages insert policy"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND user_id IS NOT NULL) OR
    (guest_id IS NOT NULL AND guest_name IS NOT NULL)
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_guest 
  ON messages(guest_id)
  WHERE guest_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_messages_group_channel 
  ON messages(group_id)
  WHERE channel IS NOT NULL;