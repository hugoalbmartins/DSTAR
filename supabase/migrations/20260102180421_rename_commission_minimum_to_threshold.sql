/*
  # Renomear commission_minimum para commission_threshold
  
  1. Alterações
    - Renomear coluna `commission_minimum` para `commission_threshold` na tabela `users`
    - Atualizar comentário para refletir que é um threshold (limiar mínimo) e não um valor garantido
    
  2. Explicação
    - `commission_threshold`: Valor mínimo de comissões totais visíveis da Leiritrix que precisa ser atingido
      para que o backoffice comece a receber comissão
    - Exemplo: Se threshold = 6000€ e percentage = 1%, a backoffice só ganha comissão se 
      o total de comissões visíveis exceder 6000€, e receberá 1% sobre esse total
*/

-- Rename commission_minimum to commission_threshold
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'commission_minimum'
  ) THEN
    ALTER TABLE users RENAME COLUMN commission_minimum TO commission_threshold;
  END IF;
END $$;

-- Update comment to reflect correct behavior
COMMENT ON COLUMN users.commission_threshold IS 'Limiar mínimo de comissões totais visíveis da Leiritrix. O backoffice só recebe comissão se este valor for excedido (em euros)';
