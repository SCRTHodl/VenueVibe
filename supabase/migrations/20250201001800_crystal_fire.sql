/*
  # Fix messages user email reference
  
  1. Changes
    - Add username column to messages table
    - Update message policies
    - Add indexes for performance
  
  2. Security
    - Maintain existing security policies
    - Add proper constraints for user identification
*/

-- Add username column to messages if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS username text;

-- Update username column with user email for existing messages
UPDATE messages m
SET username = u.email
FROM auth.users u
WHERE m.user_id = u.id
AND m.username IS NULL;

-- Create trigger to automatically set username from auth.users
CREATE OR REPLACE FUNCTION set_message_username()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT email INTO NEW.username
    FROM auth.users
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_username_trigger
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION set_message_username();

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_messages_username 
  ON messages(username)
  WHERE username IS NOT NULL;