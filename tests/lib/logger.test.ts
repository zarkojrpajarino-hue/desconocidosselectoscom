/**
 * Test para logger - Prueba el logger existente
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleTableSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleTableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('en modo development', () => {
    beforeEach(() => {
      vi.stubEnv('MODE', 'development');
    });

    it('logger.log llama a console.log', () => {
      logger.log('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test message');
    });

    it('logger.warn llama a console.warn', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning message');
    });

    it('logger.error llama a console.error', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error message');
    });

    it('logger.info llama a console.info', () => {
      logger.info('Info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('Info message');
    });

    it('logger.debug llama a console.debug', () => {
      logger.debug('Debug message');
      expect(consoleDebugSpy).toHaveBeenCalledWith('Debug message');
    });

    it('logger.table llama a console.table', () => {
      const data = [{ name: 'Test', value: 1 }];
      logger.table(data);
      expect(consoleTableSpy).toHaveBeenCalledWith(data);
    });

    it('logger.group llama a console.group', () => {
      logger.group('Test Group');
      expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group');
    });

    it('logger.groupEnd llama a console.groupEnd', () => {
      logger.groupEnd();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('acepta múltiples argumentos', () => {
      logger.log('Message', { data: 'test' }, 123);
      expect(consoleLogSpy).toHaveBeenCalledWith('Message', { data: 'test' }, 123);
    });
  });

  describe('tipos de datos', () => {
    it('maneja objetos', () => {
      const obj = { key: 'value', nested: { data: 123 } };
      logger.log('Object:', obj);
      expect(consoleLogSpy).toHaveBeenCalledWith('Object:', obj);
    });

    it('maneja arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      logger.log('Array:', arr);
      expect(consoleLogSpy).toHaveBeenCalledWith('Array:', arr);
    });

    it('maneja errores', () => {
      const error = new Error('Test error');
      logger.error(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('maneja undefined y null', () => {
      logger.log('Undefined:', undefined);
      logger.log('Null:', null);
      expect(consoleLogSpy).toHaveBeenCalledWith('Undefined:', undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith('Null:', null);
    });
  });

  describe('uso en grupo', () => {
    it('permite logging agrupado', () => {
      logger.group('Test Group');
      logger.log('Message 1');
      logger.log('Message 2');
      logger.groupEnd();

      expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group');
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });
  });
});
