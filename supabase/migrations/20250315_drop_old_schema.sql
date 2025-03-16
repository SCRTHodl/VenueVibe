-- Drop the old token_economy schema that's no longer needed
-- We've migrated all tables to the public schema with te_ prefix

DROP SCHEMA IF EXISTS token_economy CASCADE;

-- This CASCADE option will remove all objects (tables, functions, etc.) that depend on this schema
-- This ensures a clean removal of all token_economy objects
