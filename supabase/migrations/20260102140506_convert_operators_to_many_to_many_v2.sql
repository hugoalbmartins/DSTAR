/*
  # Convert Operators to Many-to-Many Relationship with Partners
  
  ## Overview
  This migration changes the relationship between partners and operators from 
  one-to-many to many-to-many, allowing:
  - Each partner to have multiple operators
  - Each operator to be shared by multiple partners
  
  ## Changes
  
  ### 1. New Table: `partner_operators`
  Junction table to manage the many-to-many relationship
  - `partner_id` (uuid, FK to partners)
  - `operator_id` (uuid, FK to operators)
  - `created_at` (timestamptz)
  - Primary key on (partner_id, operator_id)
  
  ### 2. Operators Table
  - Remove `partner_id` column (moved to junction table)
  - Update RLS policies to use junction table
  
  ### 3. Data Migration
  - Migrate existing operator-partner relationships to junction table
  - Preserve all existing associations
  
  ## Important Notes
  - This enables operator sharing across multiple partners
  - RLS policies updated to reflect new structure
  - Existing data is preserved during migration
*/

-- Create junction table for partner-operator relationships
CREATE TABLE IF NOT EXISTS partner_operators (
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (partner_id, operator_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_partner_operators_partner_id ON partner_operators(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_operators_operator_id ON partner_operators(operator_id);

-- Migrate existing data and remove old column
DO $$
BEGIN
  -- Only proceed if partner_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operators' AND column_name = 'partner_id'
  ) THEN
    -- Copy existing relationships to junction table
    INSERT INTO partner_operators (partner_id, operator_id)
    SELECT partner_id, id
    FROM operators
    WHERE partner_id IS NOT NULL
    ON CONFLICT (partner_id, operator_id) DO NOTHING;
    
    -- Drop old RLS policy that depends on partner_id
    DROP POLICY IF EXISTS "Partners can view own operators" ON operators;
    
    -- Remove partner_id column from operators
    ALTER TABLE operators DROP COLUMN IF EXISTS partner_id;
  END IF;
END $$;

-- Enable RLS on junction table
ALTER TABLE partner_operators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_operators

-- Admins can view all associations
CREATE POLICY "Admins can view all partner_operators"
  ON partner_operators FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can create associations
CREATE POLICY "Admins can insert partner_operators"
  ON partner_operators FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can delete associations
CREATE POLICY "Admins can delete partner_operators"
  ON partner_operators FOR DELETE
  TO authenticated
  USING (is_admin());

-- Backoffice can view all associations
CREATE POLICY "Backoffice can view all partner_operators"
  ON partner_operators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'backoffice'
      AND users.active = true
    )
  );

-- Backoffice can create associations
CREATE POLICY "Backoffice can insert partner_operators"
  ON partner_operators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'backoffice'
      AND users.active = true
    )
  );

-- Backoffice can delete associations
CREATE POLICY "Backoffice can delete partner_operators"
  ON partner_operators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'backoffice'
      AND users.active = true
    )
  );

-- Partners can view their own associations
CREATE POLICY "Partners can view own partner_operators"
  ON partner_operators FOR SELECT
  TO authenticated
  USING (partner_id = auth.uid());