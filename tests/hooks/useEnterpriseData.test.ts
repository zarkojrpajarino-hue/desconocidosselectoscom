import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useDealVelocity,
  useFinancialFromKPIs,
  useLeadScoring,
  usePipelineForecast,
  useCashFlowForecast,
  useLostReasonsAnalysis,
  useKPITargets,
  useBudgetComparison,
} from '@/hooks/useEnterpriseData';
import { createWrapper } from '../test-utils';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: mockSelect,
    })),
    rpc: mockRpc,
  },
}));

describe('Enterprise Data Hooks', () => {
  const mockOrganizationId = 'org-123';
  const mockLeadId = 'lead-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockGte.mockReturnThis();
    mockLte.mockReturnThis();
    mockOrder.mockReturnThis();
    mockLimit.mockReturnThis();
    mockSingle.mockReturnThis();
    mockMaybeSingle.mockReturnThis();
  });

  describe('useDealVelocity', () => {
    it('should fetch deal velocity metrics successfully', async () => {
      const mockMetrics = {
        average_time_to_close_days: 45,
        total_deals_closed: 12,
        average_deal_value: 15000,
        fastest_deal_days: 10,
        slowest_deal_days: 90,
        velocity_trend: 'improving',
      };

      const mockStalledDeals = [
        {
          id: 'deal-1',
          name: 'Deal A',
          days_in_stage: 60,
          current_stage: 'negotiation',
          estimated_value: 10000,
        },
        {
          id: 'deal-2',
          name: 'Deal B',
          days_in_stage: 45,
          current_stage: 'proposal',
          estimated_value: 20000,
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: [mockMetrics],
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: mockStalledDeals,
        error: null,
      });

      const { result } = renderHook(() => useDealVelocity(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        metrics: expect.objectContaining({
          average_time_to_close_days: 45,
          total_deals_closed: 12,
        }),
        stalled_deals: expect.arrayContaining([
          expect.objectContaining({ id: 'deal-1' }),
        ]),
      });
    });

    it('should return null when organizationId is null', async () => {
      const { result } = renderHook(() => useDealVelocity(null), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      mockSelect.mockResolvedValueOnce({
        data: null,
        error,
      });

      const { result } = renderHook(() => useDealVelocity(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('useFinancialFromKPIs', () => {
    it('should calculate financial projections from KPIs', async () => {
      const mockProjections = {
        projected_revenue: 500000,
        projected_expenses: 300000,
        projected_profit: 200000,
        growth_rate: 15,
        burn_rate: 25000,
        runway_months: 12,
      };

      mockSelect.mockResolvedValueOnce({
        data: [mockProjections],
        error: null,
      });

      const { result } = renderHook(
        () => useFinancialFromKPIs(mockOrganizationId),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        projected_revenue: 500000,
        projected_profit: 200000,
      });
    });

    it('should handle missing data', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(
        () => useFinancialFromKPIs(mockOrganizationId),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('useLeadScoring', () => {
    it('should calculate and fetch lead score', async () => {
      const mockScore = {
        lead_id: mockLeadId,
        total_score: 85,
        breakdown: {
          source: 20,
          engagement: 25,
          fit_icp: 20,
          urgency: 10,
          behavior: 10,
        },
        classification: 'hot' as const,
        probability_to_close: 75,
        next_best_action: 'Schedule demo call',
      };

      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          lead_id: mockLeadId,
          total_score: 85,
          source_score: 20,
          engagement_score: 25,
          fit_score: 20,
          urgency_score: 10,
          behavior_score: 10,
          classification: 'hot',
          probability_to_close: 75,
          next_best_action: 'Schedule demo call',
        },
        error: null,
      });

      const { result } = renderHook(() => useLeadScoring(mockLeadId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        total_score: 85,
        classification: 'hot',
        probability_to_close: 75,
      });
    });

    it('should return null for null leadId', async () => {
      const { result } = renderHook(() => useLeadScoring(null), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('usePipelineForecast', () => {
    it('should forecast revenue by pipeline stages', async () => {
      const mockForecast = [
        {
          stage: 'qualified',
          expected_revenue: 50000,
          deal_count: 5,
          probability: 30,
        },
        {
          stage: 'proposal',
          expected_revenue: 75000,
          deal_count: 3,
          probability: 50,
        },
        {
          stage: 'negotiation',
          expected_revenue: 100000,
          deal_count: 2,
          probability: 70,
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: mockForecast,
        error: null,
      });

      // Mock target revenue
      mockSelect.mockResolvedValueOnce({
        data: [{ target_revenue: 300000 }],
        error: null,
      });

      const { result } = renderHook(
        () => usePipelineForecast(mockOrganizationId),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        conservative_scenario: expect.any(Object),
        realistic_scenario: expect.any(Object),
        optimistic_scenario: expect.any(Object),
        breakdown_by_stage: expect.any(Array),
      });
    });
  });

  describe('useCashFlowForecast', () => {
    it('should forecast cash flow for 6 months', async () => {
      const mockForecast = Array.from({ length: 6 }, (_, i) => ({
        month: `2026-${String(i + 1).padStart(2, '0')}`,
        projected_revenue: 50000 + i * 5000,
        projected_expenses: 30000 + i * 2000,
        net_cash_flow: 20000 + i * 3000,
        cumulative_cash: 100000 + (20000 + i * 3000) * (i + 1),
      }));

      mockOrder.mockResolvedValueOnce({
        data: mockForecast,
        error: null,
      });

      const { result } = renderHook(
        () => useCashFlowForecast(mockOrganizationId, 6),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(6);
      expect(result.current.isUsingDemoData).toBe(false);
    });

    it('should forecast cash flow for 12 months', async () => {
      const mockForecast = Array.from({ length: 12 }, (_, i) => ({
        month: `2026-${String(i + 1).padStart(2, '0')}`,
        projected_revenue: 50000,
        projected_expenses: 30000,
        net_cash_flow: 20000,
        cumulative_cash: 100000 + 20000 * (i + 1),
      }));

      mockOrder.mockResolvedValueOnce({
        data: mockForecast,
        error: null,
      });

      const { result } = renderHook(
        () => useCashFlowForecast(mockOrganizationId, 12),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(12);
    });

    it('should indicate when using demo data', async () => {
      // No cached forecast
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // No real revenue
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // No real expenses
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // No real cash balance
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(
        () => useCashFlowForecast(mockOrganizationId, 6),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isUsingDemoData).toBe(true);
    });
  });

  describe('useLostReasonsAnalysis', () => {
    it('should analyze lost deals and reasons', async () => {
      const mockReasons = [
        {
          reason: 'Price too high',
          count: 5,
          total_value: 50000,
          percentage: 40,
        },
        {
          reason: 'Competitor chosen',
          count: 3,
          total_value: 30000,
          percentage: 30,
        },
        {
          reason: 'No budget',
          count: 2,
          total_value: 20000,
          percentage: 20,
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: mockReasons,
        error: null,
      });

      const { result } = renderHook(
        () => useLostReasonsAnalysis(mockOrganizationId),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        total_lost_deals: expect.any(Number),
        total_lost_value: expect.any(Number),
        reasons: expect.arrayContaining([
          expect.objectContaining({ reason: 'Price too high' }),
        ]),
        insights: expect.any(Array),
      });
    });

    it('should generate insights from lost reasons', async () => {
      const mockReasons = [
        {
          reason: 'Price too high',
          count: 8,
          total_value: 80000,
          percentage: 60,
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: mockReasons,
        error: null,
      });

      const { result } = renderHook(
        () => useLostReasonsAnalysis(mockOrganizationId),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.insights).toContainEqual(
        expect.stringContaining('Price too high')
      );
    });
  });

  describe('useKPITargets', () => {
    it('should fetch KPI targets and progress', async () => {
      const mockTargets = [
        {
          kpi_name: 'Monthly Revenue',
          target_value: 100000,
          current_value: 85000,
          progress_percentage: 85,
          status: 'on_track',
        },
        {
          kpi_name: 'New Customers',
          target_value: 10,
          current_value: 12,
          progress_percentage: 120,
          status: 'exceeded',
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: mockTargets,
        error: null,
      });

      const { result } = renderHook(() => useKPITargets(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        kpi_name: 'Monthly Revenue',
        progress_percentage: 85,
      });
    });

    it('should handle empty targets', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useKPITargets(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useBudgetComparison', () => {
    it('should compare budget vs actual spending', async () => {
      const mockComparison = {
        total_budget: 500000,
        total_actual: 450000,
        variance: 50000,
        variance_percentage: 10,
        categories: [
          {
            category: 'Marketing',
            budget: 100000,
            actual: 95000,
            variance: 5000,
            variance_percentage: 5,
          },
          {
            category: 'Operations',
            budget: 200000,
            actual: 180000,
            variance: 20000,
            variance_percentage: 10,
          },
        ],
      };

      mockSelect.mockResolvedValueOnce({
        data: [mockComparison],
        error: null,
      });

      const { result } = renderHook(
        () => useBudgetComparison(mockOrganizationId),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        total_budget: 500000,
        variance: 50000,
        categories: expect.arrayContaining([
          expect.objectContaining({ category: 'Marketing' }),
        ]),
      });
    });

    it('should calculate variance correctly', async () => {
      const mockComparison = {
        total_budget: 100000,
        total_actual: 110000,
        variance: -10000,
        variance_percentage: -10,
        categories: [],
      };

      mockSelect.mockResolvedValueOnce({
        data: [mockComparison],
        error: null,
      });

      const { result } = renderHook(
        () => useBudgetComparison(mockOrganizationId),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.variance).toBe(-10000);
      expect(result.current.data?.variance_percentage).toBe(-10);
    });
  });
});

describe('Enterprise Hooks - React Query Integration', () => {
  it('should use correct query keys structure', async () => {
    const { enterpriseDataKeys } = await import('@/hooks/useEnterpriseData');

    expect(enterpriseDataKeys.dealVelocity('org-123')).toEqual([
      'enterpriseData',
      'dealVelocity',
      { organizationId: 'org-123' },
    ]);

    expect(enterpriseDataKeys.leadScoring('lead-123')).toEqual([
      'enterpriseData',
      'leadScoring',
      { leadId: 'lead-123' },
    ]);

    expect(enterpriseDataKeys.cashFlowForecast('org-123', 6)).toEqual([
      'enterpriseData',
      'cashFlowForecast',
      { organizationId: 'org-123', months: 6 },
    ]);
  });

  it('should have hierarchical query keys', async () => {
    const { enterpriseDataKeys } = await import('@/hooks/useEnterpriseData');

    const allKeys = enterpriseDataKeys.all;
    const specificKey = enterpriseDataKeys.dealVelocity('org-123');

    expect(specificKey[0]).toBe(allKeys[0]);
  });
});
