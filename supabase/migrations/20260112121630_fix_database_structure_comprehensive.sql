/*
  # Correção Completa da Estrutura da Base de Dados
  
  ## Resumo
  Esta migration adiciona todos os campos e tabelas que estavam em falta na base de dados,
  garantindo compatibilidade com o frontend.
  
  ## 1. Alterações na Tabela `partners`
  - `contact_person` (text, nullable) - Pessoa de contacto do parceiro
  
  ## 2. Alterações na Tabela `sales`
  - `energy_type` (text, nullable) - Tipo de energia: eletricidade, gas, dual
  - `cpe` (text, nullable) - Código CPE para eletricidade
  - `potencia` (text, nullable) - Potência contratada em kVA
  - `cui` (text, nullable) - Código CUI para gás
  - `escalao` (text, nullable) - Escalão de gás
  - `loyalty_months` (integer, default 0) - Período de fidelização em meses
  - `sale_date` (date, default CURRENT_DATE) - Data da venda
  - `client_type` (text, nullable) - Tipo de cliente: residencial, empresarial
  - `portfolio_status` (text, nullable) - Status de encarteiramento: cliente_carteira, fora_carteira
  - `solar_power` (numeric, nullable) - Potência de painéis solares em kW
  - `solar_panel_quantity` (integer, nullable) - Quantidade de painéis solares
  - `client_category_id` (uuid, nullable, FK) - Categoria de cliente da operadora
  
  ## 3. Nova Tabela `operator_client_categories`
  - `id` (uuid, primary key)
  - `operator_id` (uuid, FK to operators)
  - `name` (text) - Nome da categoria
  - `created_at` (timestamptz)
  
  ## 4. Alterações na Tabela `operators`
  - `has_client_categories` (boolean, default false) - Se a operadora usa categorias de clientes
  
  ## 5. Alterações na Tabela `operator_commission_rules`
  - `client_category_id` (uuid, nullable, FK) - Categoria de cliente específica
  - `client_type_filter` (text, default 'all') - Filtro por tipo de cliente
  - `portfolio_filter` (text, default 'all') - Filtro por encarteiramento
  
  ## 6. Segurança (RLS)
  - Todas as novas tabelas têm RLS ativado
  - Políticas apropriadas para autenticados, admin e backoffice
*/

-- ============================================================================
-- 1. ALTERAÇÕES NA TABELA PARTNERS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'contact_person'
  ) THEN
    ALTER TABLE partners ADD COLUMN contact_person text;
  END IF;
END $$;

-- ============================================================================
-- 2. ALTERAÇÕES NA TABELA SALES
-- ============================================================================

-- Campo energy_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'energy_type'
  ) THEN
    ALTER TABLE sales ADD COLUMN energy_type text;
  END IF;
END $$;

-- Campo cpe (eletricidade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'cpe'
  ) THEN
    ALTER TABLE sales ADD COLUMN cpe text;
  END IF;
END $$;

-- Campo potencia (eletricidade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'potencia'
  ) THEN
    ALTER TABLE sales ADD COLUMN potencia text;
  END IF;
END $$;

-- Campo cui (gás)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'cui'
  ) THEN
    ALTER TABLE sales ADD COLUMN cui text;
  END IF;
END $$;

-- Campo escalao (gás)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'escalao'
  ) THEN
    ALTER TABLE sales ADD COLUMN escalao text;
  END IF;
END $$;

-- Campo loyalty_months
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'loyalty_months'
  ) THEN
    ALTER TABLE sales ADD COLUMN loyalty_months integer DEFAULT 0;
  END IF;
END $$;

-- Campo sale_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'sale_date'
  ) THEN
    ALTER TABLE sales ADD COLUMN sale_date date DEFAULT CURRENT_DATE NOT NULL;
  END IF;
END $$;

-- Campo client_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'client_type'
  ) THEN
    ALTER TABLE sales ADD COLUMN client_type text CHECK (client_type IN ('residencial', 'empresarial') OR client_type IS NULL);
  END IF;
END $$;

-- Campo portfolio_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'portfolio_status'
  ) THEN
    ALTER TABLE sales ADD COLUMN portfolio_status text CHECK (portfolio_status IN ('cliente_carteira', 'fora_carteira') OR portfolio_status IS NULL);
  END IF;
END $$;

-- Campo solar_power (painéis solares)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'solar_power'
  ) THEN
    ALTER TABLE sales ADD COLUMN solar_power numeric;
  END IF;
END $$;

-- Campo solar_panel_quantity (painéis solares)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'solar_panel_quantity'
  ) THEN
    ALTER TABLE sales ADD COLUMN solar_panel_quantity integer;
  END IF;
END $$;

-- ============================================================================
-- 3. ALTERAÇÕES NA TABELA OPERATORS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operators' AND column_name = 'has_client_categories'
  ) THEN
    ALTER TABLE operators ADD COLUMN has_client_categories boolean DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- 4. CRIAR TABELA OPERATOR_CLIENT_CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS operator_client_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_category_per_operator UNIQUE (operator_id, name)
);

-- Adicionar client_category_id à tabela sales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'client_category_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN client_category_id uuid REFERENCES operator_client_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 5. ALTERAÇÕES NA TABELA OPERATOR_COMMISSION_RULES
-- ============================================================================

-- Campo client_category_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operator_commission_rules' AND column_name = 'client_category_id'
  ) THEN
    ALTER TABLE operator_commission_rules ADD COLUMN client_category_id uuid REFERENCES operator_client_categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Campo client_type_filter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operator_commission_rules' AND column_name = 'client_type_filter'
  ) THEN
    ALTER TABLE operator_commission_rules 
    ADD COLUMN client_type_filter text DEFAULT 'all' CHECK (client_type_filter IN ('residencial', 'empresarial', 'all'));
  END IF;
END $$;

-- Campo portfolio_filter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operator_commission_rules' AND column_name = 'portfolio_filter'
  ) THEN
    ALTER TABLE operator_commission_rules 
    ADD COLUMN portfolio_filter text DEFAULT 'all' CHECK (portfolio_filter IN ('cliente_carteira', 'fora_carteira', 'all'));
  END IF;
END $$;

-- ============================================================================
-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client_type ON sales(client_type);
CREATE INDEX IF NOT EXISTS idx_sales_portfolio_status ON sales(portfolio_status);
CREATE INDEX IF NOT EXISTS idx_sales_client_category_id ON sales(client_category_id);
CREATE INDEX IF NOT EXISTS idx_operator_client_categories_operator_id ON operator_client_categories(operator_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_client_category_id ON operator_commission_rules(client_category_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_client_type ON operator_commission_rules(client_type_filter);
CREATE INDEX IF NOT EXISTS idx_commission_rules_portfolio ON operator_commission_rules(portfolio_filter);

-- ============================================================================
-- 7. SEGURANÇA (RLS)
-- ============================================================================

-- Ativar RLS para operator_client_categories
ALTER TABLE operator_client_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view operator client categories" ON operator_client_categories;
DROP POLICY IF EXISTS "Admins can insert operator client categories" ON operator_client_categories;
DROP POLICY IF EXISTS "Admins can update operator client categories" ON operator_client_categories;
DROP POLICY IF EXISTS "Admins can delete operator client categories" ON operator_client_categories;

-- RLS Policies for operator_client_categories
CREATE POLICY "Users can view operator client categories"
  ON operator_client_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert operator client categories"
  ON operator_client_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );

CREATE POLICY "Admins can update operator client categories"
  ON operator_client_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );

CREATE POLICY "Admins can delete operator client categories"
  ON operator_client_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );
