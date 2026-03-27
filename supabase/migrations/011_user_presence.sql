-- User Presence Table for Poke-Yoke Clinic Verification
-- Tracks which clinic each logged-in user is currently working at

CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'assistant',
  user_name TEXT,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all presence records"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own presence"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presence"
  ON user_presence FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_presence_clinic ON user_presence(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_heartbeat ON user_presence(last_heartbeat);

-- Function to clean up stale presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM user_presence
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
