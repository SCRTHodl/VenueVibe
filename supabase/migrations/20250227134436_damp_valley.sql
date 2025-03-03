/*
  # Initial MapChat Database Schema

  1. New Tables
    - `update_subscribers` - Stores email subscriptions for app updates
    - `messages` - Stores real-time chat messages with automatic expiration
    - `event_signups` - Stores event registrations
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anonymous users
*/

-- Create table for email update subscriptions
CREATE TABLE IF NOT EXISTS update_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE update_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting subscriptions (allow anonymous)
CREATE POLICY "Anyone can subscribe for updates"
  ON update_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy for viewing subscriptions (admin only, will be configured later)
CREATE POLICY "Only admin can view subscribers"
  ON update_subscribers
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = true));

-- Create table for messages with 5-minute expiration
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  guest_id text,
  guest_name text,
  content text NOT NULL,
  channel text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '5 minutes'),
  CONSTRAINT require_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL AND guest_name IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL AND guest_name IS NOT NULL)
  )
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for reading messages
CREATE POLICY "Anyone can read messages"
  ON messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policy for sending messages (allow anonymous with guest_id)
CREATE POLICY "Anyone can send messages with proper identification"
  ON messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_id IS NOT NULL AND guest_name IS NOT NULL)
  );

-- Create table for event signups
CREATE TABLE IF NOT EXISTS event_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  participants integer NOT NULL DEFAULT 1,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_signups ENABLE ROW LEVEL SECURITY;

-- Create policy for creating event signups (allow anonymous)
CREATE POLICY "Anyone can sign up for events"
  ON event_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to see their own signups
CREATE POLICY "Users can see their own signups"
  ON event_signups
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add cleanup job to delete expired messages (every 5 minutes)
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-messages',
  '*/5 * * * *',
  $$DELETE FROM messages WHERE created_at < NOW() - INTERVAL '5 minutes'$$
);