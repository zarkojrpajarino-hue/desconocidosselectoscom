import { toast } from 'sonner';

/**
 * Maneja errores de forma consistente en toda la aplicación
 */
export function handleError(error: unknown, userMessage?: string): void {
  // Log para debugging
  console.error('Error:', error);
  
  // Determinar mensaje para usuario
  let message = userMessage || 'Ha ocurrido un error inesperado';
  
  if (!userMessage && error instanceof Error) {
    // Mensajes amigables para errores comunes
    if (error.message.includes('network')) {
      message = 'Error de conexión. Verifica tu internet.';
    } else if (error.message.includes('timeout')) {
      message = 'La operación tardó demasiado. Intenta de nuevo.';
    } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
      message = 'Sesión expirada. Por favor, inicia sesión de nuevo.';
    } else if (error.message.includes('forbidden') || error.message.includes('403')) {
      message = 'No tienes permisos para realizar esta acción.';
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      message = 'El recurso solicitado no existe.';
    }
  }
  
  toast.error(message);
}

/**
 * Muestra mensaje de éxito
 */
export function handleSuccess(message: string): void {
  toast.success(message);
}

/**
 * Muestra mensaje informativo
 */
export function handleInfo(message: string): void {
  toast.info(message);
}

/**
 * Muestra mensaje de advertencia
 */
export function handleWarning(message: string): void {
  toast.warning(message);
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
