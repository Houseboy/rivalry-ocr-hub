-- Fix for newer Supabase versions using email_confirmed_at

-- Step 1: Confirm all existing users by setting email_confirmed_at
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Step 2: Create trigger to auto-confirm new users
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Email confirmation disabled successfully! All users are now auto-confirmed.';
END $$;
