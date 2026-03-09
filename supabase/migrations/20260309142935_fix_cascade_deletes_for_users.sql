/*
  # Fix CASCADE DELETE for User-Related Tables

  1. Changes
    - Update foreign key constraints to CASCADE DELETE for users table
    - Ensures that when a user is deleted, all related records are automatically removed
    
  2. Tables Updated
    - `leads`: user_id → CASCADE DELETE
    - `lead_contact_history`: created_by → CASCADE DELETE
    - `sales`: seller_id → CASCADE DELETE (important for seller records)
    
  3. Notes
    - Notification preferences and notifications already have CASCADE
    - Sales backups already have CASCADE
    - Partner and operator relationships maintain SET NULL for data integrity
*/

-- Drop and recreate foreign key for leads.user_id
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_user_id_fkey;

ALTER TABLE leads
  ADD CONSTRAINT leads_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Drop and recreate foreign key for lead_contact_history.created_by
ALTER TABLE lead_contact_history
  DROP CONSTRAINT IF EXISTS lead_contact_history_created_by_fkey;

ALTER TABLE lead_contact_history
  ADD CONSTRAINT lead_contact_history_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Drop and recreate foreign key for sales.seller_id
ALTER TABLE sales
  DROP CONSTRAINT IF EXISTS sales_seller_id_fkey;

ALTER TABLE sales
  ADD CONSTRAINT sales_seller_id_fkey
  FOREIGN KEY (seller_id)
  REFERENCES users(id)
  ON DELETE CASCADE;
