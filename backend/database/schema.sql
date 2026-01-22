-- Steward Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_tokens JSONB,
  subscription TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  raw_command TEXT NOT NULL,
  parsed_intent JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  requires_approval BOOLEAN DEFAULT true,
  preview JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'pending',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  auto_approve_reminders BOOLEAN DEFAULT true,
  auto_approve_calendar_blocks BOOLEAN DEFAULT true,
  auto_approve_summaries BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  email_connected BOOLEAN DEFAULT false,
  calendar_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_task_id ON activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp DESC);

-- Function to update updated_at timestamp
-- SET search_path = '' prevents search path injection attacks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- NOTE: RLS is intentionally disabled because we use API key authentication (service role key)
-- The backend validates user_id in application logic before accessing data
-- 
-- Security Advisor will show warnings, but this is acceptable for API key-based auth
-- If you want to enable RLS later with Supabase Auth, uncomment the policies below
-- and remove the DISABLE statements

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Optional: RLS Policies (uncomment if you enable RLS and use Supabase Auth)
-- Enable RLS: ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Then add policies like:
-- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
