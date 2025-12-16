/**
 * OAuth CSRF Protection utilities
 * Generates and validates cryptographic state tokens for OAuth flows
 */

const OAUTH_STATE_SECRET = Deno.env.get('OAUTH_STATE_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'fallback-secret';
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generates a cryptographic HMAC signature
 */
async function generateHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a secure OAuth state token
 * Format: base64(timestamp:identifier:hmac)
 */
export async function generateOAuthState(identifier: string): Promise<string> {
  const timestamp = Date.now();
  const data = `${timestamp}:${identifier}`;
  const hmac = await generateHMAC(data, OAUTH_STATE_SECRET);
  const state = `${timestamp}:${identifier}:${hmac}`;
  
  // Base64 encode for URL safety
  return btoa(state);
}

/**
 * Validates an OAuth state token and extracts the identifier
 * Returns the identifier if valid, null if invalid
 */
export async function validateOAuthState(state: string): Promise<{ valid: boolean; identifier: string | null; error?: string }> {
  try {
    // Decode base64
    const decoded = atob(state);
    const parts = decoded.split(':');
    
    if (parts.length !== 3) {
      return { valid: false, identifier: null, error: 'Invalid state format' };
    }
    
    const [timestampStr, identifier, providedHmac] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    // Check expiry
    if (Date.now() - timestamp > STATE_EXPIRY_MS) {
      return { valid: false, identifier: null, error: 'State token expired' };
    }
    
    // Verify HMAC
    const data = `${timestamp}:${identifier}`;
    const expectedHmac = await generateHMAC(data, OAUTH_STATE_SECRET);
    
    if (providedHmac !== expectedHmac) {
      return { valid: false, identifier: null, error: 'Invalid state signature' };
    }
    
    return { valid: true, identifier };
  } catch (error) {
    return { valid: false, identifier: null, error: 'Failed to parse state token' };
  }
}
