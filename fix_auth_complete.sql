-- Complete fix for email confirmation issues

-- Step 1: Confirm all existing users
UPDATE auth.users 
SET email_confirmed = true 
WHERE email_confirmed = false;

-- Step 2: Set default for new users
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed SET DEFAULT true;

-- Step 3: Create trigger to auto-confirm new users
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

-- Step 4: Update any pending invitations
UPDATE auth.users 
SET email_confirmed = true 
WHERE email_confirmed = false OR email_confirmed IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Email confirmation disabled successfully! All users are now auto-confirmed.';
END $$;
