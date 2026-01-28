/*
  # Create Clients, Addresses, Services and Leads Management System

  ## Overview
  This migration normalizes the database structure by separating clients, addresses, and services into independent entities, and adds a lead management system.

  ## 1. New Tables

  ### `clients` - Client records
  - `id` (uuid, PK, auto-generated)
  - `name` (text, required) - Client full name
  - `nif` (text, unique, required) - 9-digit tax ID
  - `email` (text, optional) - Client email
  - `phone` (text, optional) - Client phone number
  - `client_type` (text, required) - 'residencial' or 'empresarial'
  - `portfolio_status` (text, optional) - For empresarial: 'novo', 'cliente_carteira', 'fora_carteira'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `addresses` - Client addresses
  - `id` (uuid, PK, auto-generated)
  - `client_id` (uuid, FK to clients, required)
  - `street_address` (text, required) - Street name and number
  - `postal_code` (text, required) - Portuguese postal code (0000-000)
  - `city` (text, required) - City/locality
  - `is_active` (boolean, default true) - Whether address is still active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `services` - Services associated with addresses
  - `id` (uuid, PK, auto-generated)
  - `address_id` (uuid, FK to addresses, required)
  - `service_number` (text, optional) - Service number (numero de serviço)
  - `service_type` (text, required) - 'energia_eletricidade', 'energia_gas', 'energia_dual', 'telecomunicacoes', 'paineis_solares'
  - `operator_id` (uuid, FK to operators, optional)
  - `cpe` (text, optional) - CPE code for electricity
  - `potencia` (text, optional) - Power rating for electricity
  - `cui` (text, optional) - CUI code for gas
  - `escalao` (text, optional) - Gas tier
  - `req` (text, optional) - REQ number for telecommunications
  - `loyalty_months` (integer, default 0) - Current loyalty period in months
  - `loyalty_end_date` (date, optional) - When loyalty period ends
  - `is_active` (boolean, default true) - Whether service is currently active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `leads` - Sales leads
  - `id` (uuid, PK, auto-generated)
  - `client_id` (uuid, FK to clients, required)
  - `user_id` (uuid, FK to users, optional) - Assigned user/seller
  - `observations` (text, optional) - Lead notes and observations
  - `sale_type` (text, required) - Expected sale type: 'NI', 'MC', 'Refid', 'Up_sell', 'Cross_sell'
  - `alert_date` (date, required) - Date to trigger alert
  - `status` (text, default 'nova') - 'nova', 'em_contacto', 'qualificada', 'convertida', 'perdida'
  - `converted_sale_id` (uuid, FK to sales, optional) - Sale created from this lead
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Updates to Existing Tables

  ### `sales` table updates
  - Add `client_id` (uuid, FK to clients, optional) - Reference to client
  - Add `address_id` (uuid, FK to addresses, optional) - Reference to address
  - Add `service_id` (uuid, FK to services, optional) - Reference to service
  - Add `prt` (text, optional) - PRT number
  - Add `numero_servico` (text, optional) - Service number (required when status = 'ativo')

  ## 3. Security
  - Enable RLS on all new tables
  - Add policies for authenticated users based on role
  - Admins can view/edit all records
  - Backoffice can view/edit all records
  - Sellers can view their own records and all clients

  ## 4. Indexes
  - Index on clients.nif for fast lookup
  - Index on services.service_number for fast lookup
  - Index on leads.alert_date for alert queries
  - Index on leads.status for filtering

  ## 5. Important Notes
  - Existing sales data will remain unchanged for now
  - A separate data migration script will be needed to populate these tables from existing sales
  - Services track loyalty periods independently, replacing address-based tracking
  - Each service can have only one address, but each address can have multiple services
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nif text UNIQUE NOT NULL CHECK (length(nif) = 9 AND nif ~ '^[0-9]+$'),
  email text,
  phone text,
  client_type text NOT NULL CHECK (client_type IN ('residencial', 'empresarial')),
  portfolio_status text CHECK (portfolio_status IN ('novo', 'cliente_carteira', 'fora_carteira')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  street_address text NOT NULL,
  postal_code text NOT NULL CHECK (postal_code ~ '^\d{4}-\d{3}$'),
  city text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_id uuid NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
  service_number text,
  service_type text NOT NULL CHECK (service_type IN ('energia_eletricidade', 'energia_gas', 'energia_dual', 'telecomunicacoes', 'paineis_solares')),
  operator_id uuid REFERENCES operators(id) ON DELETE SET NULL,
  cpe text,
  potencia text,
  cui text,
  escalao text,
  req text,
  loyalty_months integer DEFAULT 0,
  loyalty_end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  observations text,
  sale_type text NOT NULL CHECK (sale_type IN ('NI', 'MC', 'Refid', 'Refid_Acrescimo', 'Refid_Decrescimo', 'Up_sell', 'Cross_sell')),
  alert_date date NOT NULL,
  status text DEFAULT 'nova' CHECK (status IN ('nova', 'em_contacto', 'qualificada', 'convertida', 'perdida')),
  converted_sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to sales table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'address_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN address_id uuid REFERENCES addresses(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN service_id uuid REFERENCES services(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'prt'
  ) THEN
    ALTER TABLE sales ADD COLUMN prt text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'numero_servico'
  ) THEN
    ALTER TABLE sales ADD COLUMN numero_servico text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_nif ON clients(nif);
CREATE INDEX IF NOT EXISTS idx_addresses_client_id ON addresses(client_id);
CREATE INDEX IF NOT EXISTS idx_services_address_id ON services(address_id);
CREATE INDEX IF NOT EXISTS idx_services_service_number ON services(service_number);
CREATE INDEX IF NOT EXISTS idx_services_operator_id ON services(operator_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_alert_date ON leads(alert_date);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_address_id ON sales(address_id);
CREATE INDEX IF NOT EXISTS idx_sales_service_id ON sales(service_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table

-- Admins and backoffice can view all clients
CREATE POLICY "Admins and backoffice can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );

-- Sellers can view all clients
CREATE POLICY "Sellers can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'vendedor'
      AND users.active = true
    )
  );

-- Admins and backoffice can insert clients
CREATE POLICY "Admins and backoffice can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );

-- Admins and backoffice can update clients
CREATE POLICY "Admins and backoffice can update clients"
  ON clients FOR UPDATE
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

-- Admins can delete clients
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.active = true
    )
  );

-- RLS Policies for addresses table

-- Authenticated users can view addresses
CREATE POLICY "Authenticated users can view addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.active = true
    )
  );

-- Admins and backoffice can insert addresses
CREATE POLICY "Admins and backoffice can insert addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );

-- Admins and backoffice can update addresses
CREATE POLICY "Admins and backoffice can update addresses"
  ON addresses FOR UPDATE
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

-- Admins can delete addresses
CREATE POLICY "Admins can delete addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.active = true
    )
  );

-- RLS Policies for services table

-- Authenticated users can view services
CREATE POLICY "Authenticated users can view services"
  ON services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.active = true
    )
  );

-- Admins and backoffice can insert services
CREATE POLICY "Admins and backoffice can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );

-- Admins and backoffice can update services
CREATE POLICY "Admins and backoffice can update services"
  ON services FOR UPDATE
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

-- Admins can delete services
CREATE POLICY "Admins can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.active = true
    )
  );

-- RLS Policies for leads table

-- Admins and backoffice can view all leads
CREATE POLICY "Admins and backoffice can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );

-- Sellers can view their own leads
CREATE POLICY "Sellers can view their own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'vendedor'
      AND users.active = true
    )
  );

-- Admins and backoffice can insert leads
CREATE POLICY "Admins and backoffice can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'backoffice')
      AND users.active = true
    )
  );

-- Sellers can insert their own leads
CREATE POLICY "Sellers can insert their own leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'vendedor'
      AND users.active = true
    )
  );

-- Admins and backoffice can update all leads
CREATE POLICY "Admins and backoffice can update all leads"
  ON leads FOR UPDATE
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

-- Sellers can update their own leads
CREATE POLICY "Sellers can update their own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'vendedor'
      AND users.active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'vendedor'
      AND users.active = true
    )
  );

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.active = true
    )
  );