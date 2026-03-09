/*
  # Add hidden field to users table
  
  1. Changes
    - Add `hidden` boolean field to users table (default: false)
    - Hidden users won't appear in normal user lists but retain full functionality
  
  2. Security
    - No RLS changes needed - admins can already see all users
*/

-- Add hidden field to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'hidden'
  ) THEN
    ALTER TABLE users ADD COLUMN hidden BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for better performance on hidden field
CREATE INDEX IF NOT EXISTS idx_users_hidden ON users(hidden) WHERE hidden = false;
