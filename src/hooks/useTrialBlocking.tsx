import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlanType } from '@/constants/subscriptionLimits';

/**
 * Hook que bloquea automáticamente la app cuando el trial expira
 * y redirige a la página de pricing
 * 
 * USO: Llamar este hook en el App.tsx o en ProtectedRoute
 */
export function useTrialBlocking() {
  const { user, currentOrganizationId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isBlocked, setIsBlocked] = useState(false);

  // Rutas que están permitidas incluso con trial expirado
  const allowedRoutes = [
    '/',
    '/login',
    '/signup',
    '/select-organization',
    '/profile',
    '/integraciones',
  ];

  useEffect(() => {
    if (!user || !currentOrganizationId) return;

    const checkTrialStatus = async () => {
      try {
        // Obtener datos de la organización actual
        const { data: org, error } = await supabase
          .from('organizations')
          .select('plan, trial_ends_at, subscription_status, created_at')
          .eq('id', currentOrganizationId)
          .single();

        if (error) throw error;

        const plan = org.plan as PlanType;
        const isTrial = plan === 'trial' || plan === 'free';

        // Si no es trial, no hacer nada
        if (!isTrial) {
          setIsBlocked(false);
          return;
        }

        // Calcular si el trial expiró
        let isExpired = false;

        if (org.trial_ends_at) {
          // Usar trial_ends_at si existe
          const trialEnd = new Date(org.trial_ends_at);
          const now = new Date();
          isExpired = now > trialEnd;
        } else if (org.created_at) {
          // Calcular basado en created_at (14 días desde creación)
          const createdAt = new Date(org.created_at);
          const trialEnd = new Date(createdAt);
          trialEnd.setDate(trialEnd.getDate() + 14);
          
          const now = new Date();
          isExpired = now > trialEnd;
        }

        // Si el trial expiró
        if (isExpired) {
          setIsBlocked(true);

          // Actualizar plan a 'free' si todavía está en 'trial'
          if (org.plan === 'trial') {
            await supabase
              .from('organizations')
              .update({ plan: 'free' })
              .eq('id', currentOrganizationId);
          }

          // Si no está en una ruta permitida, redirigir a landing con pricing
          const isAllowedRoute = allowedRoutes.some(route => 
            location.pathname.startsWith(route)
          );

          if (!isAllowedRoute) {
            toast.error('Tu periodo de prueba ha finalizado', {
              description: 'Elige un plan para continuar usando la aplicación',
              duration: 5000,
            });

            // Redirigir después de un breve delay
            setTimeout(() => {
              navigate('/#pricing', { replace: true });
            }, 1000);
          }
        } else {
          setIsBlocked(false);
        }
      } catch (error) {
        console.error('[useTrialBlocking] Error:', error);
      }
    };

    // Verificar inmediatamente
    checkTrialStatus();

    // Verificar cada 1 minuto
    const interval = setInterval(checkTrialStatus, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, currentOrganizationId, location.pathname, navigate]);

  return {
    isBlocked,
  };
}

/**
 * Componente que bloquea el contenido cuando el trial expira
 * 
 * USO: Envolver contenido que debe bloquearse
 * 
 * <TrialBlocker>
 *   <YourContent />
 * </TrialBlocker>
 */
interface TrialBlockerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TrialBlocker({ children, fallback }: TrialBlockerProps) {
  const { isBlocked } = useTrialBlocking();

  if (isBlocked) {
    if (fallback) return <>{fallback}</>;
    
    // Fallback por defecto: mensaje de bloqueo
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4 p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold">Periodo de prueba finalizado</h1>
          <p className="text-muted-foreground">
            Tu periodo de prueba de 14 días ha expirado. Elige un plan para continuar usando todas las funcionalidades.
          </p>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="mt-6 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
          >
            Ver Planes y Precios
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook para verificar si un email ya usó el trial
 * 
 * IMPORTANTE: Llamar ANTES del signup/onboarding
 */
export function useTrialEmailCheck() {
  const [checking, setChecking] = useState(false);

  const checkEmail = async (email: string): Promise<{
    canUseTrial: boolean;
    alreadyUsed: boolean;
    message: string;
    usedAt?: string;
  }> => {
    setChecking(true);

    try {
      const { data, error } = await supabase.rpc('can_use_trial', {
        user_email: email.toLowerCase(),
      });

      if (error) throw error;

      // Parse JSON response
      const result = data as {
        can_use_trial: boolean;
        already_used: boolean;
        message: string;
        used_at?: string;
      };

      return {
        canUseTrial: result.can_use_trial,
        alreadyUsed: result.already_used,
        message: result.message,
        usedAt: result.used_at,
      };
    } catch (error) {
      console.error('[useTrialEmailCheck] Error:', error);
      
      // En caso de error, permitir (fail-open)
      return {
        canUseTrial: true,
        alreadyUsed: false,
        message: 'No se pudo verificar el email',
      };
    } finally {
      setChecking(false);
    }
  };

  return {
    checkEmail,
    checking,
  };
}

/**
 * Hook para obtener información detallada del trial con contador en tiempo real
 */
export function useTrialCountdown() {
  const { currentOrganizationId } = useAuth();
  const [trialInfo, setTrialInfo] = useState<{
    isTrial: boolean;
    daysRemaining: number;
    hoursRemaining: number;
    minutesRemaining: number;
    isExpired: boolean;
    trialEndDate: Date | null;
    percentage: number; // % del trial transcurrido
  }>({
    isTrial: false,
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    isExpired: false,
    trialEndDate: null,
    percentage: 0,
  });

  useEffect(() => {
    if (!currentOrganizationId) return;

    const updateCountdown = async () => {
      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('plan, trial_ends_at, created_at')
          .eq('id', currentOrganizationId)
          .single();

        if (error) throw error;

        const plan = org.plan as PlanType;
        const isTrial = plan === 'trial' || plan === 'free';

        if (!isTrial) {
          setTrialInfo({
            isTrial: false,
            daysRemaining: 0,
            hoursRemaining: 0,
            minutesRemaining: 0,
            isExpired: false,
            trialEndDate: null,
            percentage: 0,
          });
          return;
        }

        // Calcular fecha de fin del trial
        let trialEndDate: Date;

        if (org.trial_ends_at) {
          trialEndDate = new Date(org.trial_ends_at);
        } else if (org.created_at) {
          const createdAt = new Date(org.created_at);
          trialEndDate = new Date(createdAt);
          trialEndDate.setDate(trialEndDate.getDate() + 14);
        } else {
          return;
        }

        const now = new Date();
        const diffMs = trialEndDate.getTime() - now.getTime();

        if (diffMs <= 0) {
          // Trial expirado
          setTrialInfo({
            isTrial: true,
            daysRemaining: 0,
            hoursRemaining: 0,
            minutesRemaining: 0,
            isExpired: true,
            trialEndDate,
            percentage: 100,
          });
          return;
        }

        // Calcular tiempo restante
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        // Calcular porcentaje transcurrido
        const trialStartDate = org.created_at ? new Date(org.created_at) : new Date();
        const totalTrialMs = trialEndDate.getTime() - trialStartDate.getTime();
        const elapsedMs = now.getTime() - trialStartDate.getTime();
        const percentage = Math.min(100, Math.max(0, (elapsedMs / totalTrialMs) * 100));

        setTrialInfo({
          isTrial: true,
          daysRemaining: days,
          hoursRemaining: hours,
          minutesRemaining: minutes,
          isExpired: false,
          trialEndDate,
          percentage,
        });
      } catch (error) {
        console.error('[useTrialCountdown] Error:', error);
      }
    };

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada minuto para el contador en tiempo real
    const interval = setInterval(updateCountdown, 60 * 1000);

    return () => clearInterval(interval);
  }, [currentOrganizationId]);

  return trialInfo;
}
