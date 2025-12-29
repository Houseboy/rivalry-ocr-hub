-- Disable email confirmation for development
UPDATE auth.config 
SET disable_signup = false, 
    enable_email_confirmations = false
WHERE id = 1;
