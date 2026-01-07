/*
  # Add Password Field to Partners Table

  1. Changes
    - Add `password` column to partners table for authentication
    - Add `must_change_password` column to force password change on first login
    - Add default values for new partners

  2. Security
    - Password field is required for partner authentication
    - Must change password flag ensures security on first login
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' AND column_name = 'password'
  ) THEN
    ALTER TABLE partners ADD COLUMN password text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE partners ADD COLUMN must_change_password boolean DEFAULT true;
  END IF;
END $$;