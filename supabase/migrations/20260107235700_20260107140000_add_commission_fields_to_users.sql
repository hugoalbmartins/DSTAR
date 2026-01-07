/*
  # Adicionar campos de comissão à tabela users
  
  1. Alterações
    - Adiciona coluna commission_percentage (numeric) - Percentagem de comissão para backoffice
    - Adiciona coluna commission_threshold (numeric) - Limiar mínimo de comissões
  
  2. Notas
    - Campos aplicáveis apenas para role 'backoffice'
    - Valores padrão são 0
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'commission_percentage'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN commission_percentage numeric(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'commission_threshold'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN commission_threshold numeric(10,2) DEFAULT 0;
  END IF;
END $$;