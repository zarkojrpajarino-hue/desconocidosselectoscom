/**
 * Structured Logger para Frontend
 * Logs en formato JSON para análisis y búsqueda
 * Compatible con servicios como Sentry, LogRocket, etc.
 */

const isDevelopment = import.meta.env.MODE === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  organizationId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message?: string;
  context?: LogContext;
  duration_ms?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface StructuredLoggerOptions {
  component: string;
  context?: Partial<LogContext>;
}

/**
 * Crea un logger estructurado para un componente específico
 */
export function createStructuredLogger(options: StructuredLoggerOptions) {
  const baseContext: LogContext = {
    component: options.component,
    ...options.context
  };

  const formatEntry = (level: LogLevel, event: string, data?: Record<string, unknown>): LogEntry => ({
    timestamp: new Date().toISOString(),
    level,
    event,
    context: { ...baseContext, ...data?.context as Record<string, unknown> },
    ...data
  });

  const log = (level: LogLevel, event: string, data?: Record<string, unknown>) => {
    const entry = formatEntry(level, event, data);
    
    // En desarrollo: log legible
    // En producción: JSON estructurado (para servicios de logging)
    if (isDevelopment) {
      const prefix = `[${entry.context?.component}]`;
      switch (level) {
        case 'error':
          console.error(prefix, event, data);
          break;
        case 'warn':
          console.warn(prefix, event, data);
          break;
        case 'debug':
          console.debug(prefix, event, data);
          break;
        default:
          console.log(prefix, event, data);
      }
    } else if (level === 'error') {
      // En producción solo errores (el resto se puede enviar a servicio externo)
      console.error(JSON.stringify(entry));
    }
    
    // Aquí se puede integrar con Sentry, LogRocket, etc.
    // if (window.Sentry && level === 'error') {
    //   window.Sentry.captureMessage(event, { extra: entry });
    // }
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
            message: error.message
          } : { message: String(error), name: 'Unknown' }
        });
        throw error;
      }
    },

    /**
     * Log de eventos de usuario para analytics
     */
    track: (event: string, properties?: Record<string, unknown>) => {
      log('info', event, { ...properties, type: 'user_action' });
    },

    /**
     * Actualiza contexto base del logger
     */
    setContext: (newContext: Partial<LogContext>) => {
      Object.assign(baseContext, newContext);
    }
  };
}

/**
 * Logger global para uso rápido
 */
export const appLogger = createStructuredLogger({ component: 'app' });

/**
 * Helper para tracking de eventos de negocio
 */
export const trackBusinessEvent = (event: string, data: Record<string, unknown>) => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    event,
    context: {
      type: 'business_event',
      ...data
    }
  };
  
  if (isDevelopment) {
    console.log('[Business]', event, data);
  }
  
  // En producción: enviar a analytics
  // analytics.track(event, data);
};
