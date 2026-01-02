/*
  # Adicionar Configurações de Comissão para Backoffice

  1. Alterações na Tabela `users`
    - Adicionar coluna `commission_percentage` (numeric) - Percentagem sobre comissões de operadoras visíveis
    - Adicionar coluna `commission_minimum` (numeric) - Valor mínimo de comissões garantido
    
  2. Notas
    - Estes campos aplicam-se apenas a utilizadores de backoffice (role = 'backoffice')
    - commission_percentage: valor entre 0 e 100 (ex: 10 = 10%)
    - commission_minimum: valor mínimo em euros garantido ao backoffice
    - Por padrão, ambos são 0
*/

-- Add commission_percentage column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'commission_percentage'
  ) THEN
    ALTER TABLE users ADD COLUMN commission_percentage numeric DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100);
  END IF;
END $$;

-- Add commission_minimum column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'commission_minimum'
  ) THEN
    ALTER TABLE users ADD COLUMN commission_minimum numeric DEFAULT 0 CHECK (commission_minimum >= 0);
  END IF;
END $$;

-- Add comments for clarity
COMMENT ON COLUMN users.commission_percentage IS 'Percentagem da comissão do backoffice sobre comissões de operadoras visíveis (0-100)';
COMMENT ON COLUMN users.commission_minimum IS 'Valor mínimo garantido de comissões para o backoffice (em euros)';
