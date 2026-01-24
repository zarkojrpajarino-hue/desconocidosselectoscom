/**
 * Test para logger - Tests simplificados que no dependen del ambiente
 */
import { describe, it, expect } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  describe('API Methods', () => {
    it('should have log method', () => {
      expect(typeof logger.log).toBe('function');
      expect(() => logger.log('Test message')).not.toThrow();
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
      expect(() => logger.info('Info message')).not.toThrow();
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    it('should have table method', () => {
      expect(typeof logger.table).toBe('function');
      expect(() => logger.table([{ name: 'Test', value: 1 }])).not.toThrow();
    });

    it('should have group method', () => {
      expect(typeof logger.group).toBe('function');
      expect(() => logger.group('Test Group')).not.toThrow();
    });

    it('should have groupEnd method', () => {
      expect(typeof logger.groupEnd).toBe('function');
      expect(() => logger.groupEnd()).not.toThrow();
    });
  });

  describe('Argument Handling', () => {
    it('should accept multiple arguments', () => {
      expect(() => logger.log('Message', { data: 'test' }, 123)).not.toThrow();
    });

    it('should handle objects', () => {
      expect(() => logger.log('Object:', { key: 'value', number: 42 })).not.toThrow();
    });

    it('should handle arrays', () => {
      expect(() => logger.log('Array:', [1, 2, 3, 4, 5])).not.toThrow();
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error:', error)).not.toThrow();
    });

    it('should handle undefined and null', () => {
      expect(() => logger.log('Undefined:', undefined)).not.toThrow();
      expect(() => logger.log('Null:', null)).not.toThrow();
    });

    it('should allow grouped logging', () => {
      expect(() => {
        logger.group('Test Group');
        logger.log('Inside group 1');
        logger.log('Inside group 2');
        logger.groupEnd();
      }).not.toThrow();
    });
  });
});
