/*
  # Adiciona Colunas em Falta na Tabela Sales

  1. Novas Colunas
    - `active_date` (date, nullable) - Data em que a venda ficou ativa
    - `loyalty_end_date` (date, nullable) - Data de fim do período de fidelização (calculada automaticamente)
    - `req` (text, nullable) - REQ para vendas de telecomunicações
    - `commission_backoffice` (numeric, default 0) - Comissão para utilizador de backoffice
    - `is_backoffice` (boolean, default false) - Indica se é uma venda de backoffice

  2. Trigger
    - Atualiza automaticamente loyalty_end_date quando active_date ou loyalty_months mudam
*/

-- Add active_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'active_date'
  ) THEN
    ALTER TABLE sales ADD COLUMN active_date date;
  END IF;
END $$;

-- Add loyalty_end_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'loyalty_end_date'
  ) THEN
    ALTER TABLE sales ADD COLUMN loyalty_end_date date;
  END IF;
END $$;

-- Add req column for telecommunications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'req'
  ) THEN
    ALTER TABLE sales ADD COLUMN req text;
  END IF;
END $$;

-- Add commission_backoffice column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'commission_backoffice'
  ) THEN
    ALTER TABLE sales ADD COLUMN commission_backoffice numeric DEFAULT 0;
  END IF;
END $$;

-- Add is_backoffice column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'is_backoffice'
  ) THEN
    ALTER TABLE sales ADD COLUMN is_backoffice boolean DEFAULT false;
  END IF;
END $$;

-- Create or replace function to auto-calculate loyalty_end_date
CREATE OR REPLACE FUNCTION calculate_loyalty_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active_date IS NOT NULL AND NEW.loyalty_months > 0 THEN
    NEW.loyalty_end_date := NEW.active_date + (NEW.loyalty_months || ' months')::interval;
  ELSE
    NEW.loyalty_end_date := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_calculate_loyalty_end_date ON sales;
CREATE TRIGGER trigger_calculate_loyalty_end_date
  BEFORE INSERT OR UPDATE OF active_date, loyalty_months
  ON sales
  FOR EACH ROW
  EXECUTE FUNCTION calculate_loyalty_end_date();
