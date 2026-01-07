/*
  # Adicionar coluna operator_id à tabela sales
  
  1. Alterações
    - Adiciona coluna operator_id (uuid, nullable) à tabela sales
  
  2. Notas
    - Necessário antes de criar a tabela operators com FK
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'sales' 
    AND column_name = 'operator_id'
  ) THEN
    ALTER TABLE public.sales 
    ADD COLUMN operator_id uuid;
  END IF;
END $$;