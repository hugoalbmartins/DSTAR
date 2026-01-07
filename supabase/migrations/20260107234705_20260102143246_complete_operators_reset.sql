/*
  # Complete Operators Table Reset
  
  This migration performs a complete reset of the operators table
  to ensure it's properly visible to PostgREST.
  
  1. Tables
    - Drop and recreate operators table with all columns
    - Recreate all foreign key relationships
    - Set up proper indexes
  
  2. Security
    - Enable RLS
    - Create policies for admin and backoffice access
*/

-- Drop all dependent foreign keys first
ALTER TABLE IF EXISTS sales DROP CONSTRAINT IF EXISTS sales_operator_id_fkey;
ALTER TABLE IF EXISTS partner_operators DROP CONSTRAINT IF EXISTS partner_operators_operator_id_fkey;

-- Drop and recreate the operators table completely
DROP TABLE IF EXISTS operators CASCADE;

CREATE TABLE operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  commission_visible_to_bo boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  categories text[] DEFAULT ARRAY[]::text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_operators_active ON operators(active);
CREATE INDEX idx_operators_name ON operators(name);

-- Enable RLS
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all operators"
  ON operators FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert operators"
  ON operators FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update operators"
  ON operators FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete operators"
  ON operators FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Backoffice can view all operators"
  ON operators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'backoffice'
      AND users.active = true
    )
  );

-- Recreate updated_at trigger
CREATE OR REPLACE FUNCTION update_operators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_operators_updated_at();

-- Recreate foreign key constraints
ALTER TABLE sales
  ADD CONSTRAINT sales_operator_id_fkey 
    FOREIGN KEY (operator_id) 
    REFERENCES operators(id) 
    ON DELETE SET NULL;

ALTER TABLE partner_operators
  ADD CONSTRAINT partner_operators_operator_id_fkey
    FOREIGN KEY (operator_id)
    REFERENCES operators(id)
    ON DELETE CASCADE;

-- Create index on foreign keys
CREATE INDEX IF NOT EXISTS idx_sales_operator_id ON sales(operator_id);
CREATE INDEX IF NOT EXISTS idx_partner_operators_operator_id ON partner_operators(operator_id);

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';