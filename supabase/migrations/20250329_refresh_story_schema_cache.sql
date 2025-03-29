-- Refresh stories table schema cache
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS content_url TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS status TEXT;

-- Add comments to force schema cache refresh
COMMENT ON COLUMN public.stories.content_url IS 'URL of the story content';
COMMENT ON COLUMN public.stories.status IS 'Current status of the story';

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
