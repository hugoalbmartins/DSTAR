/*
  # Adicionar campos para vendas de painéis solares

  1. Alterações
    - Adiciona coluna `solar_power` (numeric) - Potência instalada em kW
    - Adiciona coluna `solar_panel_quantity` (integer) - Quantidade de painéis instalados

  2. Notas
    - Campos opcionais (nullable) para vendas de categoria 'paineis_solares'
    - Potência em kW (kilowatts)
    - Quantidade de painéis em unidades inteiras
*/

-- Add solar_power column (potência instalada em kW)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'solar_power'
  ) THEN
    ALTER TABLE sales ADD COLUMN solar_power numeric;
  END IF;
END $$;

-- Add solar_panel_quantity column (quantidade de painéis)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'solar_panel_quantity'
  ) THEN
    ALTER TABLE sales ADD COLUMN solar_panel_quantity integer;
  END IF;
END $$;