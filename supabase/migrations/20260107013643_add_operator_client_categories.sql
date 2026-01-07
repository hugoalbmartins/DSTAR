/*
  # Add Client Categories System for Operators

  1. New Tables
    - `operator_client_categories`
      - `id` (uuid, primary key)
      - `operator_id` (uuid, foreign key to operators)
      - `name` (text, category name)
      - `created_at` (timestamptz)
  
  2. Changes to Existing Tables
    - `operators`
      - Add `has_client_categories` (boolean, default false)
    - `sales`
      - Add `client_category_id` (uuid, nullable, foreign key to operator_client_categories)
    - `operator_commission_rules`
      - Add `client_category_id` (uuid, nullable, foreign key to operator_client_categories)
      - When NULL, commission rule applies to all client categories
      - When set, commission rule applies only to that specific category
  
  3. Security
    - Enable RLS on `operator_client_categories` table
    - Add policies for authenticated users to read categories
    - Add policies for admins/backoffice to manage categories
*/

-- Add has_client_categories to operators table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operators' AND column_name = 'has_client_categories'
  ) THEN
    ALTER TABLE operators ADD COLUMN has_client_categories boolean DEFAULT false;
  END IF;
END $$;

-- Create operator_client_categories table
CREATE TABLE IF NOT EXISTS operator_client_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_category_per_operator UNIQUE (operator_id, name)
);

-- Add client_category_id to sales table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'client_category_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN client_category_id uuid REFERENCES operator_client_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add client_category_id to operator_commission_rules table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operator_commission_rules' AND column_name = 'client_category_id'
  ) THEN
    ALTER TABLE operator_commission_rules ADD COLUMN client_category_id uuid REFERENCES operator_client_categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_operator_client_categories_operator_id ON operator_client_categories(operator_id);
CREATE INDEX IF NOT EXISTS idx_sales_client_category_id ON sales(client_category_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_client_category_id ON operator_commission_rules(client_category_id);

-- Enable RLS
ALTER TABLE operator_client_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view operator client categories" ON operator_client_categories;
DROP POLICY IF EXISTS "Admins can insert operator client categories" ON operator_client_categories;
DROP POLICY IF EXISTS "Admins can update operator client categories" ON operator_client_categories;
DROP POLICY IF EXISTS "Admins can delete operator client categories" ON operator_client_categories;

-- RLS Policies for operator_client_categories
CREATE POLICY "Users can view operator client categories"
  ON operator_client_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert operator client categories"
  ON operator_client_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
    )
  );

CREATE POLICY "Admins can update operator client categories"
  ON operator_client_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
    )
  );

CREATE POLICY "Admins can delete operator client categories"
  ON operator_client_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
    )
  );