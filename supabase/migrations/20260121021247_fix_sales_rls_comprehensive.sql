/*
  # Completa Políticas RLS para Vendas

  1. Alterações
    - Adiciona política explícita de DELETE para administradores
    - Garante que todas as operações CRUD têm políticas explícitas
    - Remove ambiguidade da política ALL

  2. Segurança
    - Mantém todas as verificações de segurança existentes
    - Usa a função is_admin() para verificação consistente
*/

-- Adiciona política explícita de DELETE para admins
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sales' 
    AND policyname = 'Admins can delete sales'
  ) THEN
    CREATE POLICY "Admins can delete sales"
      ON sales
      FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;
