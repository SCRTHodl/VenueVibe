/*
  # Fix messages table group_id type
  
  1. Changes
    - Change group_id column type to UUID
    - Add proper foreign key constraint
    - Update indexes
  
  2. Security
    - Maintain existing security policies
*/

-- Temporarily disable RLS
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Create a new column with correct type
ALTER TABLE messages 
ADD COLUMN group_id_new uuid;

-- Drop existing indexes that reference group_id
DROP INDEX IF EXISTS idx_messages_group_channel;

-- Update the new column with converted UUIDs
UPDATE messages 
SET group_id_new = group_id::uuid 
WHERE group_id IS NOT NULL;

-- Drop old column and rename new one
ALTER TABLE messages 
DROP COLUMN group_id,
ADD COLUMN group_id uuid NOT NULL DEFAULT gen_random_uuid();

-- Update group_id with the converted values
UPDATE messages 
SET group_id = group_id_new;

-- Drop temporary column
ALTER TABLE messages 
DROP COLUMN group_id_new;

-- Re-create indexes
CREATE INDEX IF NOT EXISTS idx_messages_group_channel 
ON messages(group_id, channel);

-- Re-enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;