/*
  # Correção do Constraint de Portfolio Filter

  1. Alterações
    - Atualiza constraint do campo `portfolio_filter` na tabela `operator_commission_rules`
    - Adiciona a opção 'novo' às opções válidas: 'novo', 'cliente_carteira', 'fora_carteira', 'all'

  2. Motivo
    - O constraint atual não inclui 'novo', impedindo a criação de regras de comissão para novos clientes
    - Mantém consistência com as opções disponíveis em portfolio_status da tabela sales
*/

-- Remove o constraint antigo
ALTER TABLE operator_commission_rules DROP CONSTRAINT IF EXISTS operator_commission_rules_portfolio_filter_check;

-- Adiciona o novo constraint com a opção 'novo'
ALTER TABLE operator_commission_rules ADD CONSTRAINT operator_commission_rules_portfolio_filter_check 
  CHECK (portfolio_filter IN ('novo', 'cliente_carteira', 'fora_carteira', 'all'));
