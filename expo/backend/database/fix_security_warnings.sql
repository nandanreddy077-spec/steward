-- Fix Security Warnings in Supabase
-- Run this in Supabase SQL Editor to fix the Security Advisor warnings

-- Fix 1: Function Search Path Mutable
-- This prevents search path injection attacks
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

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

-- Recreate triggers with the fixed function
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix 2: RLS Disabled (This is intentional - see note below)
-- RLS warnings are expected because we use API key authentication
-- The backend validates user_id in application logic
-- This is acceptable for API key-based authentication
-- 
-- If you want to enable RLS later with Supabase Auth:
-- 1. Enable RLS: ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- 2. Create policies for each table
-- 3. Update backend to use Supabase Auth instead of API keys

-- Note: The RLS warnings will remain, but they're acceptable for this architecture
-- Your backend uses the service role key and validates access in application code




