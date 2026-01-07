/*
  # Adicionar coluna must_change_password e limpar utilizadores

  1. Alterações na Tabela users
    - Adiciona coluna `must_change_password` (boolean, default false)
    - Atualiza o admin para não precisar mudar password
  
  2. Limpeza de Utilizadores
    - Remove todos os utilizadores exceto admin@leiritrix.com
    - Limpa auth.identities (FK para auth.users)
    - Limpa auth.users
    - Limpa public.users (já tem cascade)
  
  3. Notas
    - Garante sincronia total entre auth.users e public.users
    - Remove utilizadores órfãos que causavam erro "user_already_exists"
*/

-- Adicionar coluna must_change_password à tabela users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN must_change_password boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Atualizar admin para não precisar mudar password
UPDATE public.users 
SET must_change_password = false 
WHERE email = 'admin@leiritrix.com';

-- Limpar TODOS os utilizadores exceto admin
-- Nota: auth.identities tem FK para auth.users, então deletamos primeiro
DELETE FROM auth.identities 
WHERE email != 'admin@leiritrix.com';

DELETE FROM auth.users 
WHERE email != 'admin@leiritrix.com';

-- public.users já tem ON DELETE CASCADE configurado, 
-- mas vamos garantir que está limpo também
DELETE FROM public.users 
WHERE email != 'admin@leiritrix.com';