/*
  # Add tariff field to sales table

  1. Changes
    - Add `tariff` column to `sales` table (text, nullable)
      - This field stores the tariff plan information for the sale
      - Free text field that can be manually entered

  2. Notes
    - Field is nullable to support existing sales records
    - No default value as this is optional information
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'tariff'
  ) THEN
    ALTER TABLE sales ADD COLUMN tariff text;
  END IF;
END $$;
