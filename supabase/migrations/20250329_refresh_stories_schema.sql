-- Refresh stories table schema cache
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add comments to force schema cache refresh
COMMENT ON COLUMN public.stories.created_at IS 'Story creation timestamp';
COMMENT ON COLUMN public.stories.updated_at IS 'Story last update timestamp';

-- Ensure timestamps are updated on updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON public.stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
