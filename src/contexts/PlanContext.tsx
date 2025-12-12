/**
 * Context para proveer información del plan de suscripción
 * a toda la aplicación
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { usePlanAccess, PlanAccessInfo } from '@/hooks/usePlanAccess';

const PlanContext = createContext<PlanAccessInfo | undefined>(undefined);

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const planAccess = usePlanAccess();

  return (
    <PlanContext.Provider value={planAccess}>
      {children}
    </PlanContext.Provider>
  );
}

/**
 * Hook para usar el contexto del plan
 * Lanza error si se usa fuera del PlanProvider
 */
export function usePlan(): PlanAccessInfo {
  const context = useContext(PlanContext);
  
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  
  return context;
}

/**
 * HOC para envolver componentes que necesitan el contexto del plan
 */
export function withPlan<P extends object>(
  Component: React.ComponentType<P & { plan: PlanAccessInfo }>
) {
  return function WithPlanComponent(props: P) {
    const plan = usePlan();
    return <Component {...props} plan={plan} />;
  };
}
