/*
  # Force PostgREST Schema Refresh for Commission Settings
  
  This migration forces PostgREST to reload the schema for operator_commission_settings table.
  It resolves the issue where the column nif_differentiation exists in the database but is not
  recognized by the PostgREST API endpoint.
  
  ## Changes
  - Notifies PostgREST to reload the schema cache
  - Refreshes the updated_at trigger for operator_commission_settings
*/

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Drop and recreate the updated_at trigger to ensure PostgREST sees all columns
DROP TRIGGER IF EXISTS update_operator_commission_settings_updated_at ON operator_commission_settings;

CREATE TRIGGER update_operator_commission_settings_updated_at
  BEFORE UPDATE ON operator_commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure all columns are visible in the schema
COMMENT ON TABLE operator_commission_settings IS 'Commission settings for operators with NIF differentiation support';
COMMENT ON COLUMN operator_commission_settings.nif_differentiation IS 'Enable NIF-based commission differentiation (5xx vs 123xxx)';
COMMENT ON COLUMN operator_commission_settings.allowed_sale_types IS 'Array of allowed sale types for this operator';
COMMENT ON COLUMN operator_commission_settings.commission_type IS 'Type of commission calculation: manual or automatic';
