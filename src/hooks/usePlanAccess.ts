/**
 * Hook para manejar permisos y acceso basado en el plan de suscripción
 * Centraliza toda la lógica de verificación de features por plan
 */

import { useMemo } from 'react';
import { useCurrentOrganization } from './useCurrentOrganization';
import { 
  PLAN_LIMITS, 
  PLAN_NAMES,
  PLAN_PRICES,
  PlanType, 
  PlanLimits,
  hasPlanFeature,
  isLimitReached,
  getRecommendedUpgrade
} from '@/constants/subscriptionLimits';

export interface PlanAccessInfo {
  plan: PlanType;
  planName: string;
  planPrice: number;
  limits: PlanLimits;
  
  // Feature checks
  hasFeature: (feature: keyof PlanLimits) => boolean;
  isFeatureValue: (feature: keyof PlanLimits, value: unknown) => boolean;
  
  // Limit checks
  isLimitReached: (limitKey: keyof PlanLimits, currentValue: number) => boolean;
  getRemainingLimit: (limitKey: keyof PlanLimits, currentValue: number) => number;
  getLimitPercentage: (limitKey: keyof PlanLimits, currentValue: number) => number;
  
  // Plan comparison
  canUpgradeTo: (targetPlan: PlanType) => boolean;
  recommendedUpgrade: PlanType | null;
  requiredPlanFor: (feature: keyof PlanLimits) => PlanType | null;
  
  // Plan status
  isTrial: boolean;
  isFree: boolean;
  isStarter: boolean;
  isProfessional: boolean;
  isEnterprise: boolean;
  isPaid: boolean;
  
  // UI helpers
  getFeatureBadge: (feature: keyof PlanLimits) => {
    show: boolean;
    text: string;
    variant: PlanType;
  };
  shouldShowUpgradePrompt: (feature: keyof PlanLimits) => boolean;
}

const PLAN_ORDER: Record<PlanType, number> = {
  free: 0,
  trial: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function usePlanAccess(): PlanAccessInfo {
  const { organization } = useCurrentOrganization();
  const plan: PlanType = (organization?.plan as PlanType) || 'free';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const planAccessInfo = useMemo(() => {
    // Feature checks
    const hasFeature = (feature: keyof PlanLimits): boolean => {
      return hasPlanFeature(plan, feature);
    };

    const isFeatureValue = (feature: keyof PlanLimits, value: unknown): boolean => {
      const featureValue = limits[feature];
      return featureValue === value;
    };

    // Limit checks
    const checkIsLimitReached = (limitKey: keyof PlanLimits, currentValue: number): boolean => {
      return isLimitReached(plan, limitKey, currentValue);
    };

    const getRemainingLimit = (limitKey: keyof PlanLimits, currentValue: number): number => {
      const limit = limits[limitKey];
      
      if (typeof limit === 'number') {
        if (limit === -1) return Infinity; // Ilimitado
        return Math.max(0, limit - currentValue);
      }
      
      return 0;
    };

    const getLimitPercentage = (limitKey: keyof PlanLimits, currentValue: number): number => {
      const limit = limits[limitKey];
      
      if (typeof limit === 'number') {
        if (limit === -1) return 0; // Ilimitado = 0% usado
        if (limit === 0) return 100;
        return Math.min(100, (currentValue / limit) * 100);
      }
      
      return 0;
    };

    // Plan comparison
    const canUpgradeTo = (targetPlan: PlanType): boolean => {
      return PLAN_ORDER[targetPlan] > PLAN_ORDER[plan];
    };

    const requiredPlanFor = (feature: keyof PlanLimits): PlanType | null => {
      const plans: PlanType[] = ['free', 'starter', 'professional', 'enterprise'];
      
      for (const checkPlan of plans) {
        const planLimits = PLAN_LIMITS[checkPlan];
        const value = planLimits[feature];
        
        // Si el feature tiene un valor positivo (no false, 0, o 'none')
        const isFalsy = value === false || value === 0 || value === 'none' || value === null || value === undefined;
        if (value && !isFalsy) {
          return checkPlan;
        }
      }
      
      return null;
    };

    // UI helpers
    const getFeatureBadge = (feature: keyof PlanLimits) => {
      const required = requiredPlanFor(feature);
      const hasAccess = hasFeature(feature);
      
      if (!required || hasAccess) {
        return { show: false, text: '', variant: plan };
      }
      
      return {
        show: true,
        text: PLAN_NAMES[required],
        variant: required,
      };
    };

    const shouldShowUpgradePrompt = (feature: keyof PlanLimits): boolean => {
      return !hasFeature(feature);
    };

    // Plan status
    const isTrial = plan === 'trial' || plan === 'free';
    const isFree = plan === 'free';
    const isStarter = plan === 'starter';
    const isProfessional = plan === 'professional';
    const isEnterprise = plan === 'enterprise';
    const isPaid = isStarter || isProfessional || isEnterprise;

    return {
      plan,
      planName: PLAN_NAMES[plan] || 'Free',
      planPrice: PLAN_PRICES[plan] || 0,
      limits,
      
      hasFeature,
      isFeatureValue,
      
      isLimitReached: checkIsLimitReached,
      getRemainingLimit,
      getLimitPercentage,
      
      canUpgradeTo,
      recommendedUpgrade: getRecommendedUpgrade(plan),
      requiredPlanFor,
      
      isTrial,
      isFree,
      isStarter,
      isProfessional,
      isEnterprise,
      isPaid,
      
      getFeatureBadge,
      shouldShowUpgradePrompt,
    };
  }, [plan, limits]);

  return planAccessInfo;
}
