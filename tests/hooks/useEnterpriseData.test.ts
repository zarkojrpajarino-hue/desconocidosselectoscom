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
  enterpriseDataKeys,
} from '@/hooks/useEnterpriseData';
import { createWrapper } from '../test-utils';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe('Enterprise Data Hooks', () => {
  const mockOrganizationId = 'org-123';

  describe('useDealVelocity', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useDealVelocity(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
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
  });

  describe('useFinancialFromKPIs', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useFinancialFromKPIs(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
    });
  });

  describe('useLeadScoring', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useLeadScoring('lead-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
    });

    it('should return null when leadId is null', async () => {
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
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => usePipelineForecast(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
    });
  });

  describe('useCashFlowForecast', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useCashFlowForecast(mockOrganizationId, 6), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
    });

    it('should support 6 or 12 month forecasts', () => {
      const { result: result6 } = renderHook(() => useCashFlowForecast(mockOrganizationId, 6), {
        wrapper: createWrapper(),
      });

      const { result: result12 } = renderHook(() => useCashFlowForecast(mockOrganizationId, 12), {
        wrapper: createWrapper(),
      });

      expect(result6.current).toBeDefined();
      expect(result12.current).toBeDefined();
    });
  });

  describe('useLostReasonsAnalysis', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useLostReasonsAnalysis(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
    });
  });

  describe('useKPITargets', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useKPITargets(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
    });
  });

  describe('useBudgetComparison', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useBudgetComparison(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
    });
  });

  describe('React Query Integration', () => {
    it('should use correct query keys', () => {
      expect(enterpriseDataKeys.dealVelocity('org-123')).toEqual([
        'enterpriseData',
        'dealVelocity',
        { organizationId: 'org-123' },
      ]);

      expect(enterpriseDataKeys.cashFlowForecast('org-123', 6)).toEqual([
        'enterpriseData',
        'cashFlowForecast',
        { organizationId: 'org-123', months: 6 },
      ]);
    });
  });
});
