/*
  # Sistema de Comissões por Potência Contratada

  1. Alterações na tabela `operator_commission_rules`
    - Adiciona `commission_type` (text, default 'per_contract')
      Valores possíveis: 'per_contract' ou 'per_power'
    - Se 'per_contract': usa o método atual (fixed_value + monthly_multiplier)
    - Se 'per_power': usa valores específicos por potência da tabela `power_commission_values`

  2. Nova Tabela `power_commission_values`
    - `id` (uuid, primary key)
    - `rule_id` (uuid, foreign key para operator_commission_rules)
    - `power_value` (text) - valor da potência (ex: "1.15", "2.3", etc.)
    - `seller_commission` (numeric) - valor da comissão para o vendedor
    - `partner_commission` (numeric) - valor da comissão para o parceiro
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  3. Segurança
    - RLS habilitado na nova tabela
    - Políticas para acesso autenticado
    - Apenas admins podem criar/editar/deletar valores de comissão por potência

  4. Notas
    - Aplicável apenas para vendas de energia com potência definida
    - As potências padrão são: 1.15, 2.3, 3.45, 4.6, 5.75, 6.9, 10.35, 13.8, 17.25, 20.7, 27.6, 34.5, 41.4 kVA
    - A validação de potência será feita no cálculo de comissões
*/

-- Adicionar campo commission_type à tabela operator_commission_rules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operator_commission_rules' AND column_name = 'commission_type'
  ) THEN
    ALTER TABLE operator_commission_rules 
    ADD COLUMN commission_type text DEFAULT 'per_contract' NOT NULL;
    
    -- Adicionar constraint para validar os valores
    ALTER TABLE operator_commission_rules 
    ADD CONSTRAINT operator_commission_rules_commission_type_check 
    CHECK (commission_type IN ('per_contract', 'per_power'));
  END IF;
END $$;

-- Criar tabela power_commission_values
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

-- Habilitar RLS na tabela power_commission_values
ALTER TABLE power_commission_values ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários autenticados podem visualizar
CREATE POLICY "Authenticated users can view power commission values"
  ON power_commission_values
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT: apenas admins podem criar
CREATE POLICY "Only admins can create power commission values"
  ON power_commission_values
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Política para UPDATE: apenas admins podem atualizar
CREATE POLICY "Only admins can update power commission values"
  ON power_commission_values
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Política para DELETE: apenas admins podem deletar
CREATE POLICY "Only admins can delete power commission values"
  ON power_commission_values
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_power_commission_values_rule_id 
ON power_commission_values(rule_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_power_commission_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER power_commission_values_updated_at
  BEFORE UPDATE ON power_commission_values
  FOR EACH ROW
  EXECUTE FUNCTION update_power_commission_values_updated_at();