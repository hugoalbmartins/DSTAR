/*
  # Cria Tabela power_commission_values

  1. Nova Tabela
    - `power_commission_values` - Armazena valores de comissão baseados em potência contratada
      - `id` (uuid, primary key)
      - `rule_id` (uuid, foreign key) - Referência à regra de comissão
      - `power_value` (text) - Valor da potência (ex: "1.15", "2.3", "3.45")
      - `seller_commission` (numeric, default 0) - Comissão do vendedor para esta potência
      - `partner_commission` (numeric, default 0) - Comissão do parceiro para esta potência
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - RLS habilitado
    - Apenas admins podem criar, editar e eliminar (usando função is_admin())
    - Todos os utilizadores autenticados podem visualizar
*/

-- Create power_commission_values table
CREATE TABLE IF NOT EXISTS power_commission_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES operator_commission_rules(id) ON DELETE CASCADE,
  power_value text NOT NULL,
  seller_commission numeric DEFAULT 0,
  partner_commission numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(rule_id, power_value)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_power_commission_values_rule_id 
  ON power_commission_values(rule_id);

-- Enable RLS
ALTER TABLE power_commission_values ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can insert
CREATE POLICY "Admins can insert power commission values"
  ON power_commission_values
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Policy: Admins can update
CREATE POLICY "Admins can update power commission values"
  ON power_commission_values
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policy: Admins can delete
CREATE POLICY "Admins can delete power commission values"
  ON power_commission_values
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Policy: All authenticated users can view
CREATE POLICY "Authenticated users can view power commission values"
  ON power_commission_values
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_power_commission_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_power_commission_values_updated_at ON power_commission_values;
CREATE TRIGGER trigger_update_power_commission_values_updated_at
  BEFORE UPDATE ON power_commission_values
  FOR EACH ROW
  EXECUTE FUNCTION update_power_commission_values_updated_at();
