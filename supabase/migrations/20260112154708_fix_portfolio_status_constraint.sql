/*
  # Correção do Constraint de Portfolio Status

  1. Alterações
    - Atualiza constraint do campo `portfolio_status` na tabela `sales`
    - Adiciona a opção 'novo' às opções válidas: 'novo', 'cliente_carteira', 'fora_carteira'
    - Mantém a opção NULL para retrocompatibilidade

  2. Motivo
    - O constraint atual não inclui 'novo', causando erro 400 ao tentar salvar vendas
    - A interface permite selecionar 'novo' mas o banco rejeita esse valor
*/

-- Remove o constraint antigo
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_portfolio_status_check;

-- Adiciona o novo constraint com a opção 'novo'
ALTER TABLE sales ADD CONSTRAINT sales_portfolio_status_check 
  CHECK (portfolio_status IN ('novo', 'cliente_carteira', 'fora_carteira') OR portfolio_status IS NULL);
