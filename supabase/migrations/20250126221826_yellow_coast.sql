/*
  # Initial Schema Setup for Map Chat Application

  1. New Tables
    - users
      - Custom user profile data
      - Extends Supabase auth.users
    - groups
      - Chat groups/activity groups
      - Location-based grouping
    - messages
      - Real-time chat messages
      - Linked to groups and users
    - locations
      - Points of interest and meeting locations
      - Geospatial data storage

  2. Security
    - RLS policies for all tables
    - Secure access patterns for users
*/

-- Enable PostGIS for location features
create extension if not exists postgis;

-- Users table extending auth.users
create table if not exists users (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  avatar_url text,
  last_seen timestamptz default now(),
  location geometry(Point, 4326),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Groups table for activities and chat rooms
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location geometry(Point, 4326),
  creator_id uuid references users(id),
  max_participants int default 20,
  activity_time timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Group members junction table
create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Messages table for real-time chat
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Locations table for points of interest
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location geometry(Point, 4326) not null,
  category text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table users enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table messages enable row level security;
alter table locations enable row level security;

-- Users policies
create policy "Users can read all profiles"
  on users for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on users for update
  to authenticated
  using (auth.uid() = id);

-- Groups policies
create policy "Anyone can read groups"
  on groups for select
  to authenticated
  using (true);

create policy "Authenticated users can create groups"
  on groups for insert
  to authenticated
  with check (auth.uid() = creator_id);

create policy "Group creators can update their groups"
  on groups for update
  to authenticated
  using (auth.uid() = creator_id);

-- Group members policies
create policy "Members can see group participants"
  on group_members for select
  to authenticated
  using (true);

create policy "Users can join groups"
  on group_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Messages policies
create policy "Group members can read messages"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can send messages"
  on messages for insert
  to authenticated
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from group_members
      where group_members.group_id = messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

-- Locations policies
create policy "Anyone can read locations"
  on locations for select
  to authenticated
  using (true);

create policy "Authenticated users can create locations"
  on locations for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Create indexes for better query performance
create index if not exists users_location_idx on users using gist(location);
create index if not exists groups_location_idx on groups using gist(location);
create index if not exists locations_location_idx on locations using gist(location);
create index if not exists messages_created_at_idx on messages(created_at);
create index if not exists groups_activity_time_idx on groups(activity_time);