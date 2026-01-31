-- Add last_usage_date column to users table for calculating daily limits
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_usage_date DATE DEFAULT CURRENT_DATE;

-- Comment
COMMENT ON COLUMN users.last_usage_date IS 'Last date when the user generated content. Used for processing daily writing limits.';
