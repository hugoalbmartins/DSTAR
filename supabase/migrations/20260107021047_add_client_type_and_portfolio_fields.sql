/*
  # Adicionar Tipo de Cliente e Encarteiramento

  1. Alterações na Tabela Sales
    - `client_type` (text) - Tipo de cliente: 'residencial' ou 'empresarial'
    - `portfolio_status` (text) - Encarteiramento: 'cliente_carteira' ou 'fora_carteira'
    - portfolio_status só é aplicável quando client_type = 'empresarial'

  2. Alterações na Tabela operator_commission_rules
    - `client_type_filter` (text) - Filtro por tipo de cliente: 'residencial', 'empresarial', 'all'
    - `portfolio_filter` (text) - Filtro por encarteiramento: 'cliente_carteira', 'fora_carteira', 'all'

  3. Notas
    - Campos opcionais para manter retrocompatibilidade
    - portfolio_status só é preenchido para clientes empresariais
    - Os filtros nas regras de comissão permitem definir comissões diferentes
      conforme tipo de cliente e status de encarteiramento
*/

-- Adicionar campos à tabela sales
DO $$
BEGIN
  -- Campo client_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'client_type'
  ) THEN
    ALTER TABLE sales ADD COLUMN client_type text CHECK (client_type IN ('residencial', 'empresarial') OR client_type IS NULL);
  END IF;

  -- Campo portfolio_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'portfolio_status'
  ) THEN
    ALTER TABLE sales ADD COLUMN portfolio_status text CHECK (portfolio_status IN ('cliente_carteira', 'fora_carteira') OR portfolio_status IS NULL);
  END IF;
END $$;

-- Adicionar campos à tabela operator_commission_rules
DO $$
BEGIN
  -- Campo client_type_filter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operator_commission_rules' AND column_name = 'client_type_filter'
  ) THEN
    ALTER TABLE operator_commission_rules 
    ADD COLUMN client_type_filter text DEFAULT 'all' CHECK (client_type_filter IN ('residencial', 'empresarial', 'all'));
  END IF;

  -- Campo portfolio_filter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operator_commission_rules' AND column_name = 'portfolio_filter'
  ) THEN
    ALTER TABLE operator_commission_rules 
    ADD COLUMN portfolio_filter text DEFAULT 'all' CHECK (portfolio_filter IN ('cliente_carteira', 'fora_carteira', 'all'));
  END IF;
END $$;

-- Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_sales_client_type ON sales(client_type);
CREATE INDEX IF NOT EXISTS idx_sales_portfolio_status ON sales(portfolio_status);
CREATE INDEX IF NOT EXISTS idx_commission_rules_client_type ON operator_commission_rules(client_type_filter);
CREATE INDEX IF NOT EXISTS idx_commission_rules_portfolio ON operator_commission_rules(portfolio_filter);