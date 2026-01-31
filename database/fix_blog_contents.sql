-- Fix blog_contents table schema
-- Drop if exists (since it was empty and problematic) or manually migrate
-- This script ensures columns match useContentStore.ts

DROP TABLE IF EXISTS blog_contents;

CREATE TABLE blog_contents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    image_prompts JSONB DEFAULT '[]'::jsonb,
    risk_check_passed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX idx_blog_contents_user_id ON blog_contents(user_id);
CREATE INDEX idx_blog_contents_slot_id ON blog_contents(slot_id);
CREATE INDEX idx_blog_contents_status ON blog_contents(status);

-- Enable RLS (Optional but recommended for Supabase)
ALTER TABLE blog_contents ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for now to match current dev state, 
-- but ideally restricted to user_id)
CREATE POLICY "Enable all for users" ON blog_contents
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE blog_contents IS 'Stores generated blog content for each slot and user';
