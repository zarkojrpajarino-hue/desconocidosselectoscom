import { toast } from 'sonner';
import * as Sentry from "@sentry/react";
import { logger } from '@/lib/logger';

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorOptions {
  severity?: ErrorSeverity;
  showToast?: boolean;
  userMessage?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const defaultOptions: ErrorOptions = {
  severity: 'error',
  showToast: true,
};

/**
 * Maneja errores de forma consistente en toda la aplicación
 */
export function handleError(error: unknown, userMessage?: string, options: ErrorOptions = {}): void {
  const opts = { ...defaultOptions, ...options };
  
  // Log para debugging (solo en desarrollo)
  logger.error('Error:', error);
  
  // Send to Sentry in production
  if (error instanceof Error) {
    Sentry.captureException(error, {
      extra: { userMessage, severity: opts.severity }
    });
  }
  
  // Extraer mensaje del error
  let errorMessage = 'Ha ocurrido un error inesperado';
  
  if (error instanceof Error) {
    errorMessage = error.message;
    
    // Mensajes amigables para errores comunes
    if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'La operación tardó demasiado. Intenta de nuevo.';
    } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
      errorMessage = 'Sesión expirada. Por favor, inicia sesión de nuevo.';
    } else if (error.message.includes('forbidden') || error.message.includes('403')) {
      errorMessage = 'No tienes permisos para realizar esta acción.';
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      errorMessage = 'El recurso solicitado no existe.';
    } else if (error.message.includes('duplicate') || error.message.includes('23505')) {
      errorMessage = 'Este registro ya existe.';
    } else if (error.message.includes('violates row-level security')) {
      errorMessage = 'No tienes permisos para esta operación.';
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // Usar mensaje personalizado si se proporciona
  const displayMessage = userMessage || errorMessage;
  
  // Mostrar toast al usuario
  if (opts.showToast) {
    const toastFn = opts.severity === 'warning' ? toast.warning : 
                    opts.severity === 'info' ? toast.info : 
                    toast.error;
    
    toastFn(displayMessage, {
      action: opts.action,
    });
  }
}

/**
 * Muestra mensaje de éxito
 */
export function handleSuccess(message: string, description?: string): void {
  toast.success(message, { description });
}

/**
 * Muestra mensaje informativo
 */
export function handleInfo(message: string, description?: string): void {
  toast.info(message, { description });
}

/**
 * Muestra mensaje de advertencia
 */
export function handleWarning(message: string, description?: string): void {
  toast.warning(message, { description });
}

/**
 * Wrapper para operaciones async con manejo de errores
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, errorMessage);
    return null;
  }
}

/**
 * Wrapper con retry para operaciones async
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  errorMessage?: string
): Promise<T | null> {
  let lastError: unknown;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${i + 1}/${maxRetries + 1} failed:`, error);
      
      if (i < maxRetries) {
        // Esperar antes de reintentar (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  handleError(lastError, errorMessage);
  return null;
}
