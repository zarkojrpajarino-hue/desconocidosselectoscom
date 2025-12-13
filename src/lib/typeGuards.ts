/**
 * Type guards para errores - COMPLEMENTAN errorHandler existente
 * 
 * USO: Estos type guards ayudan a manejar errores de forma más precisa
 * en combinación con el errorHandler.ts existente
 */

/**
 * Verifica si un valor es una instancia de Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Verifica si un objeto tiene propiedad message
 */
export function isErrorWithMessage(
  error: unknown
): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Verifica si un objeto tiene code y message
 */
export function isErrorWithCode(
  error: unknown
): error is { code: string; message: string } {
  return (
    isErrorWithMessage(error) &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Extrae mensaje de cualquier tipo de error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (isErrorWithMessage(error)) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

/**
 * Extrae código de error si existe
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isErrorWithCode(error)) return error.code;
  return undefined;
}

/**
 * Interface para errores de Supabase
 */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Type guard para errores de Supabase
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  );
}

/**
 * Type guard para PostgresError
 */
export interface PostgresError {
  code: string;
  details: string;
  hint: string;
  message: string;
}

export function isPostgresError(error: unknown): error is PostgresError {
  return (
    isSupabaseError(error) &&
    'code' in error &&
    'details' in error &&
    typeof (error as PostgresError).code === 'string'
  );
}

/**
 * Type guard para Network errors
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('failed to fetch')
  );
}

/**
 * Type guard para timeout errors
 */
export function isTimeoutError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('timeout') || message.includes('timed out');
}

/**
 * Type guard para authorization errors (401)
 */
export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);
  return (
    message.includes('unauthorized') ||
    message.includes('401') ||
    code === '401' ||
    code === 'PGRST301'
  );
}

/**
 * Type guard para forbidden errors (403)
 */
export function isForbiddenError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);
  return (
    message.includes('forbidden') ||
    message.includes('403') ||
    code === '403'
  );
}

/**
 * Type guard para not found errors (404)
 */
export function isNotFoundError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);
  return (
    message.includes('not found') ||
    message.includes('404') ||
    code === '404' ||
    code === 'PGRST116'
  );
}

/**
 * Type guard para duplicate errors
 */
export function isDuplicateError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);
  return (
    message.includes('duplicate') ||
    message.includes('already exists') ||
    code === '23505'
  );
}

/**
 * Type guard para RLS (Row Level Security) errors
 */
export function isRLSError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('row-level security') ||
    message.includes('rls') ||
    message.includes('policy') ||
    message.includes('violates row-level security')
  );
}
