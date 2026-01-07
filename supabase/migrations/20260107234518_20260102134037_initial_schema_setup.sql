/*
  # Initial Database Schema Setup
  
  ## Overview
  This migration creates all the base tables needed for the CRM system.
  
  ## 1. Tables Created
  
  ### `users`
  - `id` (uuid, primary key) - User ID matching auth.users
  - `email` (text, unique, NOT NULL) - User email
  - `name` (text, NOT NULL) - User full name
  - `role` (text, NOT NULL) - User role: 'admin', 'backoffice', 'vendedor'
  - `active` (boolean, default true) - Whether user is active
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `partners`
  - `id` (uuid, primary key) - Partner ID
  - `name` (text, NOT NULL) - Partner name
  - `email` (text, unique) - Partner email
  - `phone` (text) - Partner phone
  - `address` (text) - Partner address
  - `nif` (text) - Partner NIF (tax ID)
  - `password` (text) - Partner password for authentication
  - `must_change_password` (boolean, default true) - Force password change on first login
  - `active` (boolean, default true) - Whether partner is active
  - `created_at` (timestamptz) - Partner creation timestamp
  
  ### `sales`
  - `id` (uuid, primary key) - Sale ID
  - `seller_id` (uuid, FK to users) - Seller who made the sale
  - `partner_id` (uuid, FK to partners) - Partner associated with sale
  - `client_name` (text, NOT NULL) - Client name
  - `client_phone` (text, NOT NULL) - Client phone
  - `client_email` (text) - Client email
  - `client_nif` (text, NOT NULL) - Client NIF
  - `client_address` (text) - Legacy client address field
  - `street_address` (text, NOT NULL) - Street and door number
  - `postal_code` (text, NOT NULL) - Postal code
  - `city` (text, NOT NULL) - City
  - `category` (text, NOT NULL) - Sale category: energia, telecomunicacoes, paineis_solares
  - `status` (text, NOT NULL) - Sale status
  - `contract_value` (numeric) - Contract value
  - `commission_seller` (numeric) - Commission for seller
  - `commission_partner` (numeric) - Commission for partner
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Sale creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `notifications`
  - `id` (uuid, primary key) - Notification ID
  - `user_id` (uuid, FK to users) - User receiving notification
  - `title` (text, NOT NULL) - Notification title
  - `message` (text, NOT NULL) - Notification message
  - `type` (text, NOT NULL) - Type: sale_created, sale_status_changed, general
  - `sale_id` (uuid, FK to sales) - Related sale
  - `read` (boolean, default false) - Read status
  - `created_at` (timestamptz) - Creation timestamp
  
  ## 2. Security (RLS)
  All tables have Row Level Security enabled with appropriate policies
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'backoffice', 'vendedor')),
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  address text,
  nif text,
  password text,
  must_change_password boolean DEFAULT true,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES users(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  client_nif text NOT NULL DEFAULT '000000000',
  client_address text,
  street_address text NOT NULL DEFAULT 'A atualizar',
  postal_code text NOT NULL DEFAULT '0000-000',
  city text NOT NULL DEFAULT 'A atualizar',
  category text NOT NULL CHECK (category IN ('energia', 'telecomunicacoes', 'paineis_solares')),
  status text NOT NULL DEFAULT 'pendente',
  contract_value numeric DEFAULT 0,
  commission_seller numeric DEFAULT 0,
  commission_partner numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('sale_created', 'sale_status_changed', 'general')),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_partner_id ON sales(partner_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
    AND active = true
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (is_admin());

-- RLS Policies for partners table
CREATE POLICY "Admins can manage all partners"
  ON partners FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Backoffice can view partners"
  ON partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('backoffice', 'admin')
      AND users.active = true
    )
  );

CREATE POLICY "Partners can view own data"
  ON partners FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for sales table
CREATE POLICY "Admins can manage all sales"
  ON sales FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Backoffice can view all sales"
  ON sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'backoffice'
      AND users.active = true
    )
  );

CREATE POLICY "Backoffice can create sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'backoffice'
      AND users.active = true
    )
  );

CREATE POLICY "Backoffice can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'backoffice'
      AND users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'backoffice'
      AND users.active = true
    )
  );

CREATE POLICY "Sellers can view own sales"
  ON sales FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Partners can view own sales"
  ON sales FOR SELECT
  TO authenticated
  USING (partner_id = auth.uid());

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sales updated_at
DROP TRIGGER IF EXISTS trigger_sales_updated_at ON sales;
CREATE TRIGGER trigger_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_updated_at();