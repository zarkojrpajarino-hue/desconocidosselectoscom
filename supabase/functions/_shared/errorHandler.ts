/**
 * Shared Error Handler for Edge Functions
 * Provides structured error logging and Sentry integration
 */

interface ErrorContext {
  functionName: string;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  additionalData?: Record<string, unknown>;
}

interface SentryPayload {
  exception: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function: string;
          lineno?: number;
        }>;
      };
    }>;
  };
  level: string;
  platform: string;
  environment: string;
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
  };
}

/**
 * Parse Sentry DSN to extract components
 */
function parseSentryDSN(dsn: string): { publicKey: string; host: string; projectId: string } | null {
  try {
    const match = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
    if (!match) return null;
    return {
      publicKey: match[1],
      host: match[2],
      projectId: match[3],
    };
  } catch {
    return null;
  }
}

/**
 * Send error to Sentry
 */
async function sendToSentry(error: Error, context: ErrorContext): Promise<void> {
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) {
    console.warn('[ErrorHandler] SENTRY_DSN not configured, skipping Sentry report');
    return;
  }

  const parsed = parseSentryDSN(dsn);
  if (!parsed) {
    console.error('[ErrorHandler] Invalid SENTRY_DSN format');
    return;
  }

  const sentryUrl = `https://${parsed.host}/api/${parsed.projectId}/store/`;

  const payload: SentryPayload = {
    exception: {
      values: [
        {
          type: error.name || 'Error',
          value: error.message,
          stacktrace: error.stack
            ? {
                frames: error.stack.split('\n').slice(1, 10).map((line) => ({
                  filename: context.functionName,
                  function: line.trim(),
                })),
              }
            : undefined,
        },
      ],
    },
    level: 'error',
    platform: 'node',
    environment: Deno.env.get('ENVIRONMENT') || 'production',
    tags: {
      function_name: context.functionName,
      ...(context.userId && { user_id: context.userId }),
      ...(context.organizationId && { organization_id: context.organizationId }),
    },
    extra: {
      requestId: context.requestId,
      endpoint: context.endpoint,
      method: context.method,
      ...context.additionalData,
    },
  };

  try {
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[ErrorHandler] Sentry response error:', response.status);
    }
  } catch (sentryError) {
    console.error('[ErrorHandler] Failed to send to Sentry:', sentryError);
  }
}

/**
 * Log error with structured format
 */
function logError(error: Error, context: ErrorContext): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    function: context.functionName,
    requestId: context.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    },
    context: {
      userId: context.userId,
      organizationId: context.organizationId,
      endpoint: context.endpoint,
      method: context.method,
      ...context.additionalData,
    },
  };

  console.error(JSON.stringify(logEntry));
}

/**
 * Main error handler - logs locally and sends to Sentry
 */
export async function handleError(
  error: unknown,
  context: ErrorContext
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  
  // Always log locally
  logError(err, context);
  
  // Send to Sentry (async, don't await to not block response)
  sendToSentry(err, context).catch(() => {
    // Silently fail if Sentry fails
  });
}

/**
 * Create error response with proper CORS headers
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Wrapper for edge function handlers with automatic error handling
 */
export function withErrorHandling(
  functionName: string,
  handler: (req: Request) => Promise<Response>,
  corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const requestId = crypto.randomUUID();

    try {
      return await handler(req);
    } catch (error) {
      await handleError(error, {
        functionName,
        requestId,
        endpoint: new URL(req.url).pathname,
        method: req.method,
      });

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        corsHeaders
      );
    }
  };
}

/**
 * Extract user context from Supabase JWT
 */
export function extractUserContext(req: Request): { userId?: string; organizationId?: string } {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return {};

    const token = authHeader.split(' ')[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return {
      userId: payload.sub,
      // organizationId would need to be extracted from app_metadata or passed in request
    };
  } catch {
    return {};
  }
}
