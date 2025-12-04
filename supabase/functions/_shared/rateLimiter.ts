/**
 * Rate Limiter para Edge Functions
 * Protege contra abuso limitando llamadas por usuario/organización
 */

// En-memory store (se reinicia con cada deploy, pero protege durante runtime)
const requestCounts = new Map<string, number[]>();

interface RateLimitConfig {
  maxRequests: number;      // Máximo de requests permitidos
  windowMs: number;         // Ventana de tiempo en ms
  identifier: string;       // Identificador único (userId, orgId, IP)
  functionName: string;     // Nombre de la función para tracking
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  message?: string;
}

/**
 * Verifica si una request está dentro del límite
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const { maxRequests, windowMs, identifier, functionName } = config;
  const key = `${identifier}-${functionName}`;
  const now = Date.now();
  
  // Obtener requests anteriores y filtrar los que están dentro de la ventana
  const previousRequests = requestCounts.get(key) || [];
  const recentRequests = previousRequests.filter(timestamp => now - timestamp < windowMs);
  
  // Calcular tiempo hasta reset
  const oldestRequest = recentRequests[0] || now;
  const resetInMs = Math.max(0, windowMs - (now - oldestRequest));
  
  // Verificar límite
  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs,
      message: `Rate limit exceeded. Try again in ${Math.ceil(resetInMs / 1000)} seconds.`
    };
  }
  
  // Registrar nueva request
  recentRequests.push(now);
  requestCounts.set(key, recentRequests);
  
  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length,
    resetInMs
  };
}

/**
 * Middleware helper para aplicar rate limiting en Edge Functions
 */
export function withRateLimit(
  identifier: string,
  functionName: string,
  options?: Partial<{ maxRequests: number; windowMs: number }>
): RateLimitResult {
  const config: RateLimitConfig = {
    maxRequests: options?.maxRequests ?? 10,  // 10 requests por defecto
    windowMs: options?.windowMs ?? 60000,     // 1 minuto por defecto
    identifier,
    functionName
  };
  
  return checkRateLimit(config);
}

/**
 * Crea Response de rate limit exceeded con headers apropiados
 */
export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Too Many Requests',
      message: result.message,
      retryAfterMs: result.resetInMs
    }),
    { 
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil(result.resetInMs / 1000).toString(),
        'X-RateLimit-Remaining': result.remaining.toString()
      }
    }
  );
}

// Limpieza periódica de entries antiguas (cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutos
  
  for (const [key, timestamps] of requestCounts.entries()) {
    const recent = timestamps.filter(t => now - t < maxAge);
    if (recent.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, recent);
    }
  }
}, 5 * 60 * 1000);
