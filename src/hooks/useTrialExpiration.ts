import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * Hook para verificar si el trial ha expirado
 * Redirige a /select-plan si el plan es trial/free y ha expirado
 */
export function useTrialExpiration() {
  const { user, currentOrganizationId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !currentOrganizationId) return;

    const checkTrialExpiration = async () => {
      try {
        // Obtener datos de la organización actual
        const { data: org, error } = await supabase
          .from('organizations')
          .select('plan, trial_ends_at, subscription_status')
          .eq('id', currentOrganizationId)
          .single();

        if (error || !org) return;

        // Si tiene plan de pago activo, no hacer nada
        if (org.plan !== 'trial' && org.plan !== 'free') {
          return;
        }

        // Verificar si el trial expiró
        if (org.trial_ends_at) {
          const trialEnd = new Date(org.trial_ends_at);
          const now = new Date();

          if (now > trialEnd) {
            logger.log('[useTrialExpiration] Trial expired, redirecting to select-plan');
            
            // Actualizar plan a 'free' si todavía está en 'trial'
            if (org.plan === 'trial') {
              await supabase
                .from('organizations')
                .update({ plan: 'free' })
                .eq('id', currentOrganizationId);
            }

            // Toast y redirigir
            toast.error('Tu periodo de prueba ha finalizado', {
              description: 'Elige un plan para continuar usando todas las funciones',
              duration: 5000,
            });

            // Redirigir a select-plan después de un momento
            setTimeout(() => {
              navigate('/select-plan?expired=true');
            }, 1500);
          }
        }
      } catch (error) {
        logger.error('[useTrialExpiration] Error:', error);
      }
    };

    // Verificar al montar
    checkTrialExpiration();

    // Verificar cada 5 minutos
    const interval = setInterval(checkTrialExpiration, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, navigate]);
}
