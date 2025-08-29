-- Add is_dummy column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- Update existing dummy users (those with @example.com email)
UPDATE profiles 
SET is_dummy = true 
WHERE email LIKE '%@example.com';

-- Create RLS policy to hide dummy users from regular app users
-- First, enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Hide dummy users from app" ON profiles;
DROP POLICY IF EXISTS "Allow all for service role" ON profiles;

-- Create policy to hide dummy users from regular users
-- This will automatically filter out dummy users in the iOS app
CREATE POLICY "Hide dummy users from app" ON profiles
FOR SELECT
USING (
  -- Show only non-dummy users to regular app users
  is_dummy = false 
  OR 
  -- Allow service role (admin dashboard) to see all users
  auth.jwt() ->> 'role' = 'service_role'
);

-- Allow all operations for authenticated users on their own non-dummy profiles
CREATE POLICY "Users can manage their own profile" ON profiles
FOR ALL
USING (
  auth.uid() = id AND is_dummy = false
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_dummy ON profiles(is_dummy);

-- Verify the changes
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_dummy = true THEN 1 END) as dummy_users,
  COUNT(CASE WHEN is_dummy = false THEN 1 END) as real_users
FROM profiles;