-- Update stories table to ensure schema cache is refreshed
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add comment to force schema cache refresh
COMMENT ON COLUMN public.stories.created_at IS 'Story creation timestamp';
