-- Add poll expiration feature
-- This migration adds the expires_at column to the polls table

ALTER TABLE polls
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create an index for efficient expiration queries
CREATE INDEX idx_polls_expires_at ON polls(expires_at)
WHERE expires_at IS NOT NULL;
