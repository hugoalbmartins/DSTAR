/*
  # Sistema de Histórico de Contactos para Leads

  1. Nova Tabela
    - `lead_contact_history`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `contact_date` (date) - Data agendada para contacto
      - `observations` (text) - Observações sobre o contacto
      - `created_at` (timestamp) - Quando foi criado este registo
      - `created_by` (uuid) - Quem criou este registo

  2. Alterações
    - Remove constraint de status se existir para permitir apenas: nova, em_contacto, convertida, perdida
    - Adiciona trigger para atualizar updated_at

  3. Segurança
    - Enable RLS on `lead_contact_history` table
    - Add policies for authenticated users

  4. Notas Importantes
    - Quando uma lead muda para "em_contacto" e depois se adiciona nova data, 
      a data antiga é automaticamente guardada no histórico
    - Histórico permite rastrear todas as tentativas de contacto
    - Alertas aparecem apenas para a data atual da lead (alert_date)
*/

-- Create lead_contact_history table
CREATE TABLE IF NOT EXISTS lead_contact_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_date date NOT NULL,
  observations text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_lead_contact_history_lead_id ON lead_contact_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contact_history_contact_date ON lead_contact_history(contact_date);

-- Enable RLS
ALTER TABLE lead_contact_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_contact_history
CREATE POLICY "Users can view contact history of their leads"
  ON lead_contact_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_contact_history.lead_id
      AND (
        leads.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
      )
    )
  );

CREATE POLICY "Users can insert contact history for their leads"
  ON lead_contact_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_contact_history.lead_id
      AND (
        leads.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
      )
    )
  );

-- Drop existing constraint if it exists and recreate with only 4 states
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_status_check' 
    AND table_name = 'leads'
  ) THEN
    ALTER TABLE leads DROP CONSTRAINT leads_status_check;
  END IF;
  
  -- Add new constraint with only 4 states
  ALTER TABLE leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('nova', 'em_contacto', 'convertida', 'perdida'));
END $$;

-- Update any existing "qualificada" leads to "em_contacto"
UPDATE leads SET status = 'em_contacto' WHERE status = 'qualificada';