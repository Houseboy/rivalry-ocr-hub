-- Disable email confirmation for newer Supabase versions
-- This updates the authentication settings directly

-- Method 1: Update the auth.users table to auto-confirm new users
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed SET DEFAULT true;

-- Method 2: Create a trigger to auto-confirm new users
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();
