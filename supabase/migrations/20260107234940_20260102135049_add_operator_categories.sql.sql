/*
  # Add Categories to Operators Table
  
  ## Overview
  This migration adds category/type support to operators, allowing each operator
  to specify which types of sales they handle.
  
  ## Changes
  
  ### Operators Table
  - Add `categories` (text[], array of categories) - Types of sales the operator handles
    Valid values: 'energia_eletricidade', 'energia_gas', 'telecomunicacoes', 'paineis_solares'
  
  ## Important Notes
  - Operators can handle multiple categories (e.g., both electricity and gas)
  - This allows filtering operators by sale category in the sale form
  - Existing operators will have empty categories array (needs manual update)
*/

-- Add categories column to operators table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operators' AND column_name = 'categories'
  ) THEN
    ALTER TABLE operators ADD COLUMN categories text[] DEFAULT '{}' NOT NULL;
  END IF;
END $$;

-- Add check constraint for valid categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'operators_categories_check'
  ) THEN
    ALTER TABLE operators
    ADD CONSTRAINT operators_categories_check
    CHECK (
      categories <@ ARRAY[
        'energia_eletricidade',
        'energia_gas',
        'telecomunicacoes',
        'paineis_solares'
      ]::text[]
    );
  END IF;
END $$;

-- Create index for array search
CREATE INDEX IF NOT EXISTS idx_operators_categories ON operators USING GIN (categories);