-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create helper functions for token encryption/decryption
-- Tokens will be encrypted using AES-256 with a key from environment secret

-- Function to encrypt tokens (called on insert/update)
CREATE OR REPLACE FUNCTION encrypt_token(plain_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from vault (set via Supabase secrets)
  -- Falls back to a placeholder if not set (should be set in production)
  encryption_key := current_setting('app.settings.token_encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- If no key configured, return the token as-is (for backward compatibility)
    -- In production, this should always be set
    RETURN plain_token;
  END IF;
  
  -- Encrypt using AES-256
  RETURN encode(
    pgp_sym_encrypt(plain_token, encryption_key, 'cipher-algo=aes256'),
    'base64'
  );
END;
$$;

-- Function to decrypt tokens (called on read)
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  encryption_key := current_setting('app.settings.token_encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- If no key configured, assume token is unencrypted (backward compatibility)
    RETURN encrypted_token;
  END IF;
  
  -- Try to decrypt
  BEGIN
    RETURN pgp_sym_decrypt(
      decode(encrypted_token, 'base64'),
      encryption_key
    );
  EXCEPTION WHEN OTHERS THEN
    -- If decryption fails, token might be unencrypted (migration period)
    RETURN encrypted_token;
  END;
END;
$$;

-- Create trigger function for automatic encryption on insert/update
CREATE OR REPLACE FUNCTION encrypt_oauth_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt access_token if it exists and is being set
  IF NEW.access_token IS NOT NULL AND NEW.access_token != '' THEN
    -- Only encrypt if not already encrypted (check for base64 pattern)
    IF NEW.access_token NOT LIKE '%==%' AND NEW.access_token NOT LIKE '%=%' THEN
      NEW.access_token := encrypt_token(NEW.access_token);
    END IF;
  END IF;
  
  -- Encrypt refresh_token if it exists and is being set
  IF NEW.refresh_token IS NOT NULL AND NEW.refresh_token != '' THEN
    IF NEW.refresh_token NOT LIKE '%==%' AND NEW.refresh_token NOT LIKE '%=%' THEN
      NEW.refresh_token := encrypt_token(NEW.refresh_token);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply encryption triggers to all OAuth token tables
DROP TRIGGER IF EXISTS encrypt_hubspot_tokens ON hubspot_accounts;
CREATE TRIGGER encrypt_hubspot_tokens
  BEFORE INSERT OR UPDATE ON hubspot_accounts
  FOR EACH ROW EXECUTE FUNCTION encrypt_oauth_tokens();

DROP TRIGGER IF EXISTS encrypt_asana_tokens ON asana_accounts;
CREATE TRIGGER encrypt_asana_tokens
  BEFORE INSERT OR UPDATE ON asana_accounts
  FOR EACH ROW EXECUTE FUNCTION encrypt_oauth_tokens();

DROP TRIGGER IF EXISTS encrypt_outlook_tokens ON outlook_accounts;
CREATE TRIGGER encrypt_outlook_tokens
  BEFORE INSERT OR UPDATE ON outlook_accounts
  FOR EACH ROW EXECUTE FUNCTION encrypt_oauth_tokens();

DROP TRIGGER IF EXISTS encrypt_google_tokens ON google_calendar_tokens;
CREATE TRIGGER encrypt_google_tokens
  BEFORE INSERT OR UPDATE ON google_calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION encrypt_oauth_tokens();

DROP TRIGGER IF EXISTS encrypt_integration_tokens ON integration_tokens;
CREATE TRIGGER encrypt_integration_tokens
  BEFORE INSERT OR UPDATE ON integration_tokens
  FOR EACH ROW EXECUTE FUNCTION encrypt_oauth_tokens();

-- Create a view function that automatically decrypts tokens for reading
CREATE OR REPLACE FUNCTION get_decrypted_oauth_token(table_name text, token_column text, record_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted_value text;
BEGIN
  -- Dynamic query to get encrypted token
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', token_column, table_name)
  INTO encrypted_value
  USING record_id;
  
  RETURN decrypt_token(encrypted_value);
END;
$$;

-- Add comment explaining encryption setup
COMMENT ON FUNCTION encrypt_token IS 'Encrypts OAuth tokens using AES-256. Requires app.settings.token_encryption_key to be set.';
COMMENT ON FUNCTION decrypt_token IS 'Decrypts OAuth tokens. Returns original value if decryption fails (backward compatibility).';