import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { PLAN_LIMITS } from '@/constants/subscriptionLimits';

// Mock the hook since it depends on context
vi.mock('@/hooks/useCurrentOrganization', () => ({
  useCurrentOrganization: () => ({
    organization: { subscription_plan: 'starter' }
  })
}));

describe('Subscription Limits Constants', () => {
  it('should have correct limits for free plan', () => {
    const freeLimits = PLAN_LIMITS.free;
    
    expect(freeLimits).toBeDefined();
    expect(freeLimits.max_users).toBe(10);
    expect(freeLimits.max_leads_per_month).toBe(2000);
    expect(freeLimits.max_okrs).toBe(10);
    expect(freeLimits.ai_analyses_per_month).toBe(20);
  });

  it('should have correct limits for starter plan', () => {
    const starterLimits = PLAN_LIMITS.starter;
    
    expect(starterLimits).toBeDefined();
    expect(starterLimits.max_users).toBe(10);
    expect(starterLimits.max_leads_per_month).toBe(2000);
  });

  it('should have correct limits for professional plan', () => {
    const proLimits = PLAN_LIMITS.professional;
    
    expect(proLimits).toBeDefined();
    expect(proLimits.max_users).toBe(25);
    expect(proLimits.ai_features).toBe(true);
    expect(proLimits.integrations).toBe(true);
  });

  it('should have unlimited features for enterprise plan', () => {
    const entLimits = PLAN_LIMITS.enterprise;
    
    expect(entLimits).toBeDefined();
    expect(entLimits.max_users).toBe(999999);
    expect(entLimits.max_leads_per_month).toBe(999999);
    expect(entLimits.ai_features).toBe(true);
    expect(entLimits.integrations).toBe(true);
    expect(entLimits.strategic_tools).toBe(true);
  });

  it('should restrict integrations for free plan', () => {
    const freeLimits = PLAN_LIMITS.free;
    
    expect(freeLimits.integrations).toBe(false);
  });

  it('should enable AI features for professional and enterprise', () => {
    expect(PLAN_LIMITS.professional.ai_features).toBe(true);
    expect(PLAN_LIMITS.enterprise.ai_features).toBe(true);
  });

  it('should restrict AI features for free and starter', () => {
    expect(PLAN_LIMITS.free.ai_features).toBe(false);
    expect(PLAN_LIMITS.starter.ai_features).toBe(false);
  });
});

describe('Plan Comparison', () => {
  it('should have increasing limits from free to enterprise', () => {
    const plans = ['free', 'starter', 'professional', 'enterprise'] as const;
    
    let previousMaxUsers = 0;
    plans.forEach(plan => {
      const limits = PLAN_LIMITS[plan];
      expect(limits.max_users).toBeGreaterThanOrEqual(previousMaxUsers);
      previousMaxUsers = limits.max_users;
    });
  });

  it('should have all required limit properties', () => {
    const requiredProps = [
      'max_users',
      'max_leads_per_month',
      'max_okrs',
      'ai_analyses_per_month',
      'ai_features',
      'integrations',
      'strategic_tools'
    ];

    Object.values(PLAN_LIMITS).forEach(limits => {
      requiredProps.forEach(prop => {
        expect(limits).toHaveProperty(prop);
      });
    });
  });
});
