-- Add voting_security to existing polls table (run if you already have polls)
ALTER TABLE polls ADD COLUMN IF NOT EXISTS voting_security VARCHAR(32) NOT NULL DEFAULT 'ip_address';
