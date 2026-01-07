/*
  # Create Auth Trigger for Public Users

  1. Purpose
    - Automatically create public.users records when auth.users are created
    - Ensure synchronization between auth.users and public.users
    - Eliminate manual user creation in public schema

  2. Changes
    - Create trigger function to handle new user creation
    - Create trigger on auth.users INSERT
    - Handle role assignment based on email patterns

  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only creates records, doesn't expose sensitive data
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role text := 'vendedor';
  user_name text;
BEGIN
  -- Extract name from metadata or use email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Determine role based on email or metadata
  IF NEW.email LIKE '%admin%' OR NEW.raw_app_meta_data->>'role' = 'admin' THEN
    user_role := 'admin';
  ELSIF NEW.raw_app_meta_data->>'role' = 'backoffice' THEN
    user_role := 'backoffice';
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role, active, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    true,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON auth.users TO postgres, service_role;
GRANT SELECT ON auth.users TO anon, authenticated;