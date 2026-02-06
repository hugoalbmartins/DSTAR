/*
  # Create notification preferences and sales backups tables

  1. New Tables
    - `notification_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id, unique)
      - `sales_alerts` (boolean, default true) - receive notifications for sales
      - `loyalty_alerts` (boolean, default true) - receive notifications for loyalty end dates
      - `lead_alerts` (boolean, default true) - receive notifications for lead alerts
      - `push_enabled` (boolean, default false) - browser push notifications enabled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `sales_backups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `file_name` (text) - name of the exported file
      - `record_count` (integer) - number of sales exported
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can read/update their own notification preferences
    - All authenticated users can create backups and view backup history

  3. Notes
    - notification_preferences has a unique constraint on user_id (one preferences row per user)
    - sales_backups tracks all backup exports for the 3-day backup alert rule
*/

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sales_alerts boolean NOT NULL DEFAULT true,
  loyalty_alerts boolean NOT NULL DEFAULT true,
  lead_alerts boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_user_id_unique UNIQUE (user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sales Backups
CREATE TABLE IF NOT EXISTS sales_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT '',
  record_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sales_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view backup history"
  ON sales_backups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create backups"
  ON sales_backups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add notification type for loyalty and lead alerts
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type = ANY (ARRAY[
      'sale_created'::text,
      'sale_status_changed'::text,
      'general'::text,
      'loyalty_alert'::text,
      'lead_alert'::text,
      'backup_reminder'::text
    ]));
END $$;
