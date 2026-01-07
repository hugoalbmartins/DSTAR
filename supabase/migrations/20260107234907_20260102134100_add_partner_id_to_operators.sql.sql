-- Add partner_id column to operators table
ALTER TABLE operators 
ADD COLUMN partner_id uuid REFERENCES partners(id) ON DELETE CASCADE;

-- Create index for partner_id
CREATE INDEX IF NOT EXISTS idx_operators_partner_id ON operators(partner_id);