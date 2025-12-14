-- Fix SQL injection risk in get_decrypted_oauth_token function
-- Add input validation with whitelisted table and column names

CREATE OR REPLACE FUNCTION public.get_decrypted_oauth_token(
  table_name TEXT,
  token_column TEXT,
  record_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  encrypted_token TEXT;
  decrypted_token TEXT;
  encryption_key TEXT;
BEGIN
  -- Validate table_name against whitelist
  IF table_name NOT IN ('hubspot_accounts', 'asana_accounts', 'outlook_accounts', 'google_calendar_tokens', 'integration_tokens') THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Validate token_column against whitelist
  IF token_column NOT IN ('access_token', 'refresh_token') THEN
    RAISE EXCEPTION 'Invalid token column: %', token_column;
  END IF;

  -- Get the encryption key
  encryption_key := current_setting('app.settings.token_encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- If no encryption key configured, return the token as-is (not encrypted)
    EXECUTE format('SELECT %I FROM %I WHERE id = $1', token_column, table_name)
    INTO encrypted_token
    USING record_id;
    RETURN encrypted_token;
  END IF;

  -- Get the encrypted token
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', token_column, table_name)
  INTO encrypted_token
  USING record_id;

  IF encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;

  -- Decrypt the token
  BEGIN
    decrypted_token := pgp_sym_decrypt(
      decode(encrypted_token, 'base64'),
      encryption_key
    )::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      -- If decryption fails, token might not be encrypted, return as-is
      RETURN encrypted_token;
  END;

  RETURN decrypted_token;
END;
$function$;