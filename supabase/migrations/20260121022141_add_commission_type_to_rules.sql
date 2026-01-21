/*
  # Adiciona Coluna commission_type à Tabela operator_commission_rules

  1. Nova Coluna
    - `commission_type` (text, default 'per_contract') - Tipo de comissão: 'per_contract' ou 'per_power'
      - 'per_contract': Comissão calculada por contrato/quantidade
      - 'per_power': Comissão calculada baseada na potência contratada

  2. Notas
    - Esta coluna permite diferenciar regras que usam cálculo baseado em potência
    - Quando commission_type = 'per_power', os valores são buscados na tabela power_commission_values
*/

-- Add commission_type column to operator_commission_rules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operator_commission_rules' AND column_name = 'commission_type'
  ) THEN
    ALTER TABLE operator_commission_rules 
    ADD COLUMN commission_type text DEFAULT 'per_contract';
  END IF;
END $$;

-- Add check constraint to ensure valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'operator_commission_rules_commission_type_check'
  ) THEN
    ALTER TABLE operator_commission_rules
    ADD CONSTRAINT operator_commission_rules_commission_type_check
    CHECK (commission_type IN ('per_contract', 'per_power'));
  END IF;
END $$;
