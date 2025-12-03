import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { logger } from '@/lib/logger';

type LimitType = 'leads' | 'users' | 'okrs' | 'ai_analysis';

interface ValidationResult {
  allowed: boolean;
  message?: string;
  currentCount?: number;
  limit?: number;
}

/**
 * Hook para validar límites de plan en el backend
 * Usar para operaciones críticas donde la validación frontend no es suficiente
 */
export function useBackendValidation() {
  const { organizationId } = useCurrentOrganization();
  const [validating, setValidating] = useState(false);

  const validateLimit = useCallback(async (limitType: LimitType): Promise<ValidationResult> => {
    if (!organizationId) {
      return { allowed: false, message: 'No organization selected' };
    }

    setValidating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-plan-limits', {
        body: { organizationId, limitType }
      });

      if (error) {
        logger.error('Backend validation error:', error);
        // Reintentar una vez antes de fallar
        try {
          const retryResult = await supabase.functions.invoke('validate-plan-limits', {
            body: { organizationId, limitType }
          });
          if (retryResult.error) {
            logger.warn('Backend validation retry failed, allowing action');
            return { allowed: true, message: 'Validation service unavailable' };
          }
          return retryResult.data as ValidationResult;
        } catch {
          return { allowed: true, message: 'Validation service unavailable' };
        }
      }

      return data as ValidationResult;
    } catch (err) {
      logger.error('Backend validation exception:', err);
      return { allowed: true, message: 'Validation service unavailable' };
    } finally {
      setValidating(false);
    }
  }, [organizationId]);

  const canAddLead = useCallback(() => validateLimit('leads'), [validateLimit]);
  const canAddUser = useCallback(() => validateLimit('users'), [validateLimit]);
  const canAddOkr = useCallback(() => validateLimit('okrs'), [validateLimit]);
  const canUseAiAnalysis = useCallback(() => validateLimit('ai_analysis'), [validateLimit]);

  return {
    validateLimit,
    canAddLead,
    canAddUser,
    canAddOkr,
    canUseAiAnalysis,
    validating
  };
}
