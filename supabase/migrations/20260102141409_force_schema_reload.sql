/*
  # Force Schema Reload
  
  This migration forces PostgREST to reload its schema cache by making a harmless
  change to the operators table (adding a comment).
*/

-- Add comment to force schema reload
COMMENT ON TABLE operators IS 'Operators/Operadoras table - manages service operators';

-- Send reload signal
NOTIFY pgrst, 'reload schema';
