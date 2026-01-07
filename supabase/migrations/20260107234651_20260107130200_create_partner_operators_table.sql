/*
  # Criar tabela partner_operators
  
  1. Tabela
    - partner_operators - Tabela de relacionamento many-to-many entre partners e operators
  
  2. Colunas
    - id (uuid, PK)
    - partner_id (uuid, FK to partners)
    - operator_id (uuid, FK to operators - será adicionado depois)
    - created_at (timestamptz)
  
  3. Security
    - RLS habilitado com políticas apropriadas
*/

CREATE TABLE IF NOT EXISTS partner_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  operator_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id, operator_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_operators_partner_id ON partner_operators(partner_id);

-- Enable RLS
ALTER TABLE partner_operators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage partner_operators"
  ON partner_operators FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Backoffice can view partner_operators"
  ON partner_operators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('backoffice', 'admin')
      AND users.active = true
    )
  );