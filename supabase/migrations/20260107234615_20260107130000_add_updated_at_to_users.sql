/*
  # Adicionar coluna updated_at à tabela users
  
  1. Alterações
    - Adiciona coluna updated_at (timestamptz) à tabela users
    - Define valor padrão como now()
  
  2. Notas
    - Necessário para o trigger handle_new_user() funcionar corretamente
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;