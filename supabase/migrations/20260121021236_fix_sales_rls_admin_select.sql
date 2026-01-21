/*
  # Corrige Políticas RLS para Visualização de Vendas

  1. Alterações
    - Adiciona política explícita de SELECT para administradores
    - Garante que admins podem sempre visualizar vendas
    - Remove possível conflito com política ALL existente

  2. Segurança
    - Mantém verificação de role = 'admin' e active = true
    - Usa a função is_admin() existente
*/

-- Adiciona política explícita de SELECT para admins (além da política ALL)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sales' 
    AND policyname = 'Admins can view all sales'
  ) THEN
    CREATE POLICY "Admins can view all sales"
      ON sales
      FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;
