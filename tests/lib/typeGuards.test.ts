/**
 * Test para typeGuards
 */
import { describe, it, expect } from 'vitest';
import {
  isError,
  isErrorWithMessage,
  isErrorWithCode,
  getErrorMessage,
  getErrorCode,
  isSupabaseError,
  isPostgresError,
  isNetworkError,
  isTimeoutError,
  isAuthError,
  isForbiddenError,
  isNotFoundError,
  isDuplicateError,
  isRLSError,
} from '@/lib/typeGuards';

describe('typeGuards', () => {
  describe('isError', () => {
    it('retorna true para instancias de Error', () => {
      expect(isError(new Error('test'))).toBe(true);
    });

    it('retorna false para objetos normales', () => {
      expect(isError({ message: 'test' })).toBe(false);
    });

    it('retorna false para strings', () => {
      expect(isError('test')).toBe(false);
    });

    it('retorna false para null/undefined', () => {
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
    });
  });

  describe('isErrorWithMessage', () => {
    it('retorna true para objetos con message', () => {
      expect(isErrorWithMessage({ message: 'test' })).toBe(true);
    });

    it('retorna true para instancias de Error', () => {
      expect(isErrorWithMessage(new Error('test'))).toBe(true);
    });

    it('retorna false para objetos sin message', () => {
      expect(isErrorWithMessage({ error: 'test' })).toBe(false);
    });

    it('retorna false para null', () => {
      expect(isErrorWithMessage(null)).toBe(false);
    });
  });

  describe('isErrorWithCode', () => {
    it('retorna true para objetos con code y message', () => {
      expect(isErrorWithCode({ code: '500', message: 'test' })).toBe(true);
    });

    it('retorna false para objetos solo con message', () => {
      expect(isErrorWithCode({ message: 'test' })).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('extrae mensaje de Error', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('extrae mensaje de objetos con message', () => {
      expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
    });

    it('retorna el string directamente', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('retorna mensaje por defecto para valores desconocidos', () => {
      expect(getErrorMessage(123)).toBe('An unknown error occurred');
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
    });
  });

  describe('getErrorCode', () => {
    it('extrae código de errores con code', () => {
      expect(getErrorCode({ code: '500', message: 'test' })).toBe('500');
    });

    it('retorna undefined para errores sin code', () => {
      expect(getErrorCode(new Error('test'))).toBeUndefined();
    });
  });

  describe('isSupabaseError', () => {
    it('retorna true para errores de Supabase', () => {
      expect(isSupabaseError({ message: 'Database error', details: 'More info' })).toBe(true);
    });

    it('retorna false para null', () => {
      expect(isSupabaseError(null)).toBe(false);
    });
  });

  describe('isPostgresError', () => {
    it('retorna true para errores de Postgres', () => {
      expect(isPostgresError({
        code: '23505',
        details: 'Key already exists',
        hint: 'Use unique value',
        message: 'Duplicate key error',
      })).toBe(true);
    });

    it('retorna false para errores sin code', () => {
      expect(isPostgresError({ message: 'test', details: 'info' })).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('detecta errores de network', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
    });

    it('detecta errores de fetch', () => {
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
    });

    it('detecta errores de connection', () => {
      expect(isNetworkError(new Error('Connection refused'))).toBe(true);
    });

    it('retorna false para otros errores', () => {
      expect(isNetworkError(new Error('Unknown error'))).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('detecta errores de timeout', () => {
      expect(isTimeoutError(new Error('Request timeout'))).toBe(true);
    });

    it('detecta timed out', () => {
      expect(isTimeoutError(new Error('Operation timed out'))).toBe(true);
    });

    it('retorna false para otros errores', () => {
      expect(isTimeoutError(new Error('Unknown error'))).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('detecta errores unauthorized', () => {
      expect(isAuthError(new Error('Unauthorized'))).toBe(true);
    });

    it('detecta errores 401', () => {
      expect(isAuthError(new Error('Error 401'))).toBe(true);
    });

    it('detecta código PGRST301', () => {
      expect(isAuthError({ code: 'PGRST301', message: 'test' })).toBe(true);
    });

    it('retorna false para otros errores', () => {
      expect(isAuthError(new Error('Unknown error'))).toBe(false);
    });
  });

  describe('isForbiddenError', () => {
    it('detecta errores forbidden', () => {
      expect(isForbiddenError(new Error('Forbidden'))).toBe(true);
    });

    it('detecta errores 403', () => {
      expect(isForbiddenError(new Error('Error 403'))).toBe(true);
    });
  });

  describe('isNotFoundError', () => {
    it('detecta errores not found', () => {
      expect(isNotFoundError(new Error('Not found'))).toBe(true);
    });

    it('detecta errores 404', () => {
      expect(isNotFoundError(new Error('Error 404'))).toBe(true);
    });

    it('detecta código PGRST116', () => {
      expect(isNotFoundError({ code: 'PGRST116', message: 'test' })).toBe(true);
    });
  });

  describe('isDuplicateError', () => {
    it('detecta errores de duplicate', () => {
      expect(isDuplicateError(new Error('Duplicate entry'))).toBe(true);
    });

    it('detecta already exists', () => {
      expect(isDuplicateError(new Error('Record already exists'))).toBe(true);
    });

    it('detecta código 23505 (Postgres)', () => {
      expect(isDuplicateError({ code: '23505', message: 'test' })).toBe(true);
    });
  });

  describe('isRLSError', () => {
    it('detecta errores de RLS', () => {
      expect(isRLSError(new Error('Violates row-level security policy'))).toBe(true);
    });

    it('detecta policy errors', () => {
      expect(isRLSError(new Error('Policy check failed'))).toBe(true);
    });
  });
});
