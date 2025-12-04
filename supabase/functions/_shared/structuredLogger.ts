/**
 * Structured Logger para Edge Functions
 * Logs en formato JSON para análisis y búsqueda
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  functionName: string;
  organizationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message?: string;
  context: LogContext;
  duration_ms?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Crea un logger estructurado para una Edge Function específica
 */
export function createLogger(functionName: string, baseContext?: Partial<LogContext>) {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  const context: LogContext = {
    functionName,
    requestId,
    ...baseContext
  };
  
  const log = (level: LogLevel, event: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      context: { ...context, ...data?.context as Record<string, unknown> },
      ...data
    };
    
    // Merge context si se pasó en data
    if (data?.context) {
      entry.context = { ...context, ...data.context as Record<string, unknown> };
    }
    
    const output = JSON.stringify(entry);
    
    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  };
  
  return {
    debug: (event: string, data?: Record<string, unknown>) => log('debug', event, data),
    info: (event: string, data?: Record<string, unknown>) => log('info', event, data),
    warn: (event: string, data?: Record<string, unknown>) => log('warn', event, data),
    error: (event: string, error?: Error | unknown, data?: Record<string, unknown>) => {
      const errorData: Record<string, unknown> = { ...data };
      
      if (error instanceof Error) {
        errorData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else if (error) {
        errorData.error = { message: String(error), name: 'Unknown' };
      }
      
      log('error', event, errorData);
    },
    
    /**
     * Mide duración de una operación async
     */
    async measure<T>(event: string, operation: () => Promise<T>, data?: Record<string, unknown>): Promise<T> {
      const start = performance.now();
      try {
        const result = await operation();
        const duration_ms = Math.round(performance.now() - start);
        log('info', `${event}_completed`, { ...data, duration_ms });
        return result;
      } catch (error) {
        const duration_ms = Math.round(performance.now() - start);
        log('error', `${event}_failed`, { 
          ...data, 
          duration_ms,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : { message: String(error), name: 'Unknown' }
        });
        throw error;
      }
    },
    
    /**
     * Actualiza el contexto del logger
     */
    setContext: (newContext: Partial<LogContext>) => {
      Object.assign(context, newContext);
    },
    
    /**
     * Obtiene el request ID para tracking
     */
    getRequestId: () => requestId
  };
}

/**
 * Helper para extraer info del request para logging
 */
export function extractRequestInfo(req: Request): Record<string, unknown> {
  return {
    method: req.method,
    url: new URL(req.url).pathname,
    userAgent: req.headers.get('user-agent')?.slice(0, 100),
    contentLength: req.headers.get('content-length')
  };
}
