/**
 * Error Handling Utilities
 * 
 * Type-safe error handling utilities to replace 'any' in catch blocks.
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface ValidationError extends AppError {
  field?: string;
  value?: unknown;
}

export interface AuthError extends AppError {
  isAuthError: true;
}

export interface NetworkError extends AppError {
  isNetworkError: true;
  url?: string;
}

export interface SupabaseErrorType {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// ============================================================================
// ERROR TYPE GUARDS
// ============================================================================

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isSupabaseError(error: unknown): error is SupabaseErrorType {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseErrorType).message === 'string'
  );
}

export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAuthError' in error &&
    (error as AuthError).isAuthError === true
  );
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isNetworkError' in error &&
    (error as NetworkError).isNetworkError === true
  );
}

// ============================================================================
// ERROR MESSAGE EXTRACTION
// ============================================================================

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (isSupabaseError(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    
    if ('error' in error && typeof (error as { error: unknown }).error === 'string') {
      return (error as { error: string }).error;
    }
  }
  
  return 'An unexpected error occurred';
}

/**
 * Extract error code if available
 */
export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null) {
    if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
      return (error as { code: string }).code;
    }
  }
  return undefined;
}

/**
 * Extract error status if available
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
      return (error as { status: number }).status;
    }
  }
  return undefined;
}

// ============================================================================
// ERROR FORMATTING
// ============================================================================

/**
 * Format error for user display
 */
export function formatUserError(error: unknown): string {
  const message = getErrorMessage(error);
  
  if (message.includes('JWT')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  if (message.includes('violates foreign key constraint')) {
    return 'This action cannot be completed due to data constraints.';
  }
  
  if (message.includes('duplicate key')) {
    return 'This record already exists.';
  }
  
  if (message.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }
  
  return message;
}

/**
 * Format error for logging
 */
export function formatLogError(error: unknown): {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  details?: unknown;
} {
  return {
    message: getErrorMessage(error),
    code: getErrorCode(error),
    status: getErrorStatus(error),
    stack: isError(error) ? error.stack : undefined,
    details: typeof error === 'object' ? error : undefined,
  };
}

// ============================================================================
// ERROR CREATION HELPERS
// ============================================================================

export function createAuthError(message: string, code?: string): AuthError {
  return {
    message,
    code,
    isAuthError: true,
  };
}

export function createNetworkError(message: string, url?: string): NetworkError {
  return {
    message,
    url,
    isNetworkError: true,
  };
}

export function createValidationError(
  message: string,
  field?: string,
  value?: unknown
): ValidationError {
  return {
    message,
    field,
    value,
  };
}

// ============================================================================
// ASYNC ERROR WRAPPER
// ============================================================================

/**
 * Wrap async function with type-safe error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (errorHandler) {
      errorHandler(error);
    }
    return null;
  }
}

/**
 * Wrap async function and return result with error
 */
export async function tryCatchResult<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error: unknown) {
    return {
      data: null,
      error: {
        message: getErrorMessage(error),
        code: getErrorCode(error),
        status: getErrorStatus(error),
      },
    };
  }
}
