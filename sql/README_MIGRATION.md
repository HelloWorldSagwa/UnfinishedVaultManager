# Database Migration Guide - is_dummy Column

## Overview
This migration adds an `is_dummy` column to the profiles table to properly distinguish between real users and dummy/test users. This replaces the previous email-based detection method.

## Benefits
1. **Cleaner separation**: Explicit flag instead of email pattern matching
2. **Better performance**: Boolean check is faster than LIKE queries
3. **iOS app security**: RLS policies automatically hide dummy users from production app
4. **No iOS app changes needed**: RLS handles filtering at database level

## Migration Steps

### 1. Run SQL Migration
Execute the `add_is_dummy_column.sql` file in Supabase SQL Editor:

```sql
-- This script will:
-- 1. Add is_dummy column with DEFAULT false
-- 2. Update existing @example.com users to is_dummy = true  
-- 3. Create RLS policies to hide dummy users from iOS app
-- 4. Create performance index
```

### 2. Verify Migration
After running the migration, verify with:

```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_dummy = true THEN 1 END) as dummy_users,
  COUNT(CASE WHEN is_dummy = false THEN 1 END) as real_users
FROM profiles;
```

### 3. Test RLS Policy
Test that dummy users are hidden:

```sql
-- As a regular user (not service role)
SELECT * FROM profiles;
-- Should only see is_dummy = false users
```

## How It Works

### For iOS App (No Changes Needed!)
- RLS policy automatically filters out dummy users
- All queries return only `is_dummy = false` users
- Complete separation at database level

### For Admin Dashboard
- Service role key bypasses RLS
- Can see and manage all users (including dummy)
- Dummy user creation sets `is_dummy = true`

## Rollback (If Needed)
```sql
-- Remove RLS policies
DROP POLICY IF EXISTS "Hide dummy users from app" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;

-- Remove column
ALTER TABLE profiles DROP COLUMN IF EXISTS is_dummy;
```

## Important Notes
- All new users from iOS app automatically get `is_dummy = false` (default value)
- Only admin dashboard can create users with `is_dummy = true`
- RLS ensures complete separation between real and dummy users