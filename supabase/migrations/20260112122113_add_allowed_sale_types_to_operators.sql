/*
  # Adicionar campo allowed_sale_types à tabela operators

  1. Alterações
    - Adiciona coluna `allowed_sale_types` (text[]) à tabela `operators`
      - Tipos de venda permitidos para esta operadora
      - Default: array vazio (todos os tipos permitidos se vazio)
      - Valores exemplo: ['NI', 'MC', 'Refid', 'Up_sell', 'Cross_sell']
    
  2. Notas
    - Array vazio significa que todos os tipos de venda são permitidos
    - Usado para filtrar tipos de venda no wizard de comissões
    - Também filtra tipos de venda disponíveis ao criar/editar vendas
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'operators' AND column_name = 'allowed_sale_types'
  ) THEN
    ALTER TABLE operators ADD COLUMN allowed_sale_types text[] DEFAULT '{}';
  END IF;
END $$;
