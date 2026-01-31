-- Content Clusters Table for Automated Writing System
-- This table stores the 30-topic cluster structure for sequential blog post generation

CREATE TABLE IF NOT EXISTS content_clusters (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL,  -- Plain TEXT: references slotId from blog_slots.slots JSON array
  cluster_group INTEGER NOT NULL CHECK (cluster_group IN (1, 2, 3)),
  content_type TEXT NOT NULL CHECK (content_type IN ('pillar', 'supporting')),
  title TEXT NOT NULL,
  description TEXT,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
  status BOOLEAN DEFAULT FALSE,
  generated_content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_clusters_slot ON content_clusters(slot_id);
CREATE INDEX IF NOT EXISTS idx_content_clusters_status ON content_clusters(status);
CREATE INDEX IF NOT EXISTS idx_content_clusters_day ON content_clusters(day_number);
CREATE INDEX IF NOT EXISTS idx_content_clusters_user_slot ON content_clusters(user_id, slot_id);

-- Unique constraint: one topic per day per slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_clusters_unique_day 
  ON content_clusters(slot_id, day_number);

-- Comment on table
COMMENT ON TABLE content_clusters IS '30-day content cluster storage for automated blog post generation with next-topic preview functionality';
