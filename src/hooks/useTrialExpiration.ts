import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
/**
 * Hook para verificar si el trial ha expirado
 * Redirige a /pricing si el plan es trial/free y ha expirado
 */
export function useTrialExpiration() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkTrialExpiration = async () => {
      try {
        // Obtener organización del usuario
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (!userRoles?.organization_id) return;

        // Obtener datos de la organización
        const { data: org, error } = await supabase
          .from('organizations')
          .select('plan, trial_ends_at, subscription_status')
          .eq('id', userRoles.organization_id)
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
            logger.log('[useTrialExpiration] Trial expired, redirecting to pricing');
            
            // Actualizar plan a 'free' si todavía está en 'trial'
            if (org.plan === 'trial') {
              await supabase
                .from('organizations')
                .update({ plan: 'free' })
                .eq('id', userRoles.organization_id);
            }

            // Toast y redirigir
            toast.error('Tu periodo de prueba ha finalizado', {
              description: 'Elige un plan para continuar usando todas las funciones',
              duration: 5000,
            });

            // Redirigir a pricing después de un momento
            setTimeout(() => {
              navigate('/pricing?expired=true');
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
