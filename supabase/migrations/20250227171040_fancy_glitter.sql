-- Fix duplicate migration issue by making this a dummy migration
-- This is required because the version 20250227170603 already exists in the schema_migrations table

-- Create a comment only to avoid empty migration errors
COMMENT ON SCHEMA public IS 'Standard public schema - migration placeholder';