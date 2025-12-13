/**
 * Test para errorHandler - Prueba el errorHandler existente
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  handleError, 
  handleSuccess, 
  handleInfo,
  handleWarning,
  withErrorHandling,
  withRetry 
} from '@/utils/errorHandler';
import { toast } from 'sonner';

// Mock de sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock de Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('muestra toast con mensaje de error', () => {
      const error = new Error('Test error');
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalled();
    });

    it('usa mensaje personalizado si se proporciona', () => {
      const error = new Error('Internal error');
      const userMessage = 'Algo salió mal';
      
      handleError(error, userMessage);
      
      expect(toast.error).toHaveBeenCalledWith(
        userMessage,
        expect.any(Object)
      );
    });

    it('maneja errores de red con mensaje amigable', () => {
      const error = new Error('network error occurred');
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('conexión'),
        expect.any(Object)
      );
    });

    it('maneja errores de timeout', () => {
      const error = new Error('request timeout');
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('tardó demasiado'),
        expect.any(Object)
      );
    });

    it('maneja errores 401 (unauthorized)', () => {
      const error = new Error('unauthorized');
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Sesión expirada'),
        expect.any(Object)
      );
    });

    it('maneja errores 403 (forbidden)', () => {
      const error = new Error('forbidden');
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('permisos'),
        expect.any(Object)
      );
    });

    it('maneja errores 404 (not found)', () => {
      const error = new Error('not found');
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('no existe'),
        expect.any(Object)
      );
    });

    it('maneja errores de duplicados', () => {
      const error = new Error('duplicate key value violates');
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('ya existe'),
        expect.any(Object)
      );
    });

    it('maneja errores de RLS (Row Level Security)', () => {
      const error = new Error('violates row-level security policy');
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('permisos'),
        expect.any(Object)
      );
    });

    it('no muestra toast si showToast es false', () => {
      const error = new Error('Test error');
      
      handleError(error, undefined, { showToast: false });
      
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('usa toast.warning si severity es warning', () => {
      const error = new Error('Warning message');
      
      handleError(error, undefined, { severity: 'warning' });
      
      expect(toast.warning).toHaveBeenCalled();
    });

    it('maneja strings como errores', () => {
      const error = 'String error message';
      
      handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        error,
        expect.any(Object)
      );
    });
  });

  describe('handleSuccess', () => {
    it('muestra toast de éxito', () => {
      handleSuccess('Operación exitosa');
      
      expect(toast.success).toHaveBeenCalledWith(
        'Operación exitosa',
        expect.any(Object)
      );
    });

    it('muestra toast con descripción', () => {
      handleSuccess('Éxito', 'Detalles adicionales');
      
      expect(toast.success).toHaveBeenCalledWith(
        'Éxito',
        { description: 'Detalles adicionales' }
      );
    });
  });

  describe('handleInfo', () => {
    it('muestra toast informativo', () => {
      handleInfo('Información importante');
      
      expect(toast.info).toHaveBeenCalledWith(
        'Información importante',
        expect.any(Object)
      );
    });
  });

  describe('handleWarning', () => {
    it('muestra toast de advertencia', () => {
      handleWarning('Cuidado con esto');
      
      expect(toast.warning).toHaveBeenCalledWith(
        'Cuidado con esto',
        expect.any(Object)
      );
    });
  });

  describe('withErrorHandling', () => {
    it('ejecuta operación exitosa y retorna resultado', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withErrorHandling(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('maneja errores y retorna null', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      
      const result = await withErrorHandling(operation, 'Operación falló');
      
      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('withRetry', () => {
    it('retorna resultado en primer intento si tiene éxito', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation, 2);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('reintenta en caso de fallo', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, 2);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('retorna null después de agotar reintentos', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      const result = await withRetry(operation, 2);
      
      expect(result).toBeNull();
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });
});
