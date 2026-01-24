import { describe, it, expect, vi } from 'vitest';
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
    expect(freeLimits.max_users).toBe(3);
    expect(freeLimits.max_leads_per_month).toBe(50);
    expect(freeLimits.max_objectives).toBe(3);
    expect(freeLimits.max_ai_analysis_per_month).toBe(2);
  });

  it('should have correct limits for starter plan', () => {
    const starterLimits = PLAN_LIMITS.starter;

    expect(starterLimits).toBeDefined();
    expect(starterLimits.max_users).toBe(10);
    expect(starterLimits.max_leads_per_month).toBe(1000);
  });

  it('should have correct limits for professional plan', () => {
    const proLimits = PLAN_LIMITS.professional;

    expect(proLimits).toBeDefined();
    expect(typeof proLimits.max_users).toBe('number');
    expect(typeof proLimits.brand_kit).toBe('boolean');
    expect(proLimits.brand_kit).toBe(true);
    expect(proLimits.automation_engine).toBe(true);
  });

  it('should have unlimited features for enterprise plan', () => {
    const entLimits = PLAN_LIMITS.enterprise;

    expect(entLimits).toBeDefined();
    expect(entLimits.max_objectives).toBe(-1); // -1 means unlimited
    expect(entLimits.max_kpis).toBe(-1);
    expect(entLimits.custom_ai_tools).toBe(true);
    expect(entLimits.white_label).toBe(true);
  });

  it('should restrict integrations for free plan', () => {
    const freeLimits = PLAN_LIMITS.free;

    expect(freeLimits.slack_integration).toBe(false);
    expect(freeLimits.zapier).toBe(false);
    expect(freeLimits.api_access).toBe('none');
  });

  it('should enable AI features for professional and enterprise', () => {
    const proLimits = PLAN_LIMITS.professional;
    const entLimits = PLAN_LIMITS.enterprise;

    expect(proLimits.brand_kit).toBe(true);
    expect(entLimits.custom_ai_tools).toBe(true);
  });

  it('should restrict AI features for free and starter', () => {
    const freeLimits = PLAN_LIMITS.free;
    const starterLimits = PLAN_LIMITS.starter;

    expect(freeLimits.brand_kit).toBe(false);
    expect(starterLimits.custom_ai_tools).toBe(false);
  });
});

describe('Plan Comparison', () => {
  it('should have increasing limits from free to enterprise', () => {
    const freeLimits = PLAN_LIMITS.free;
    const starterLimits = PLAN_LIMITS.starter;
    const proLimits = PLAN_LIMITS.professional;

    expect(starterLimits.max_users).toBeGreaterThan(freeLimits.max_users);
    expect(starterLimits.max_leads_per_month).toBeGreaterThan(freeLimits.max_leads_per_month);
    expect(proLimits.max_users).toBeGreaterThanOrEqual(starterLimits.max_users);
  });

  it('should have all required limit properties', () => {
    const freeLimits = PLAN_LIMITS.free;

    // ORGANIZACIONES
    expect(freeLimits).toHaveProperty('max_organizations_owned');
    expect(freeLimits).toHaveProperty('max_organizations_joined');

    // USUARIOS Y CRM
    expect(freeLimits).toHaveProperty('max_users');
    expect(freeLimits).toHaveProperty('max_leads_per_month');
    expect(freeLimits).toHaveProperty('lead_scoring');

    // OKRS Y KPIS
    expect(freeLimits).toHaveProperty('max_objectives');
    expect(freeLimits).toHaveProperty('max_kpis');

    // IA
    expect(freeLimits).toHaveProperty('max_ai_analysis_per_month');
    expect(freeLimits).toHaveProperty('brand_kit');

    // FINANZAS
    expect(freeLimits).toHaveProperty('revenue_tracking');
    expect(freeLimits).toHaveProperty('cash_flow_forecast');

    // INTEGRACIONES
    expect(freeLimits).toHaveProperty('slack_integration');
    expect(freeLimits).toHaveProperty('api_access');
  });
});
