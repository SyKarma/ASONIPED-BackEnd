-- Fix existing users to mark them as email verified
-- This allows existing users to continue logging in after implementing email verification

-- Mark all existing users as email verified
UPDATE users SET email_verified = 1 WHERE email_verified = 0 OR email_verified IS NULL;

-- Clear any existing verification tokens for existing users
UPDATE users SET email_verification_token = NULL WHERE email_verification_token IS NOT NULL;

-- Verify the changes
SELECT id, username, email, email_verified FROM users ORDER BY id;

