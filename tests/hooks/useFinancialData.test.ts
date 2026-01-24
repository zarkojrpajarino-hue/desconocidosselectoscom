import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFinancialData, financialKeys } from '@/hooks/useFinancialData';
import { createWrapper } from '../test-utils';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: mockSelect,
      update: mockUpdate,
    })),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentOrganizationId: 'org-123',
    userOrganizations: [
      {
        organization_id: 'org-123',
        role: 'admin',
      },
    ],
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('useFinancialData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup chain methods
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });

    mockEq.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });

    mockOrder.mockReturnValue({
      limit: mockLimit,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
  });

  describe('Basic Functionality', () => {
    it('should initialize and expose expected properties', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { financial_visibility_team: true },
        error: null,
      });

      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current).toHaveProperty('transactions');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isAdmin');
      expect(result.current).toHaveProperty('financialVisibility');
      expect(result.current).toHaveProperty('toggleFinancialVisibility');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should return empty transactions initially', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { financial_visibility_team: true },
        error: null,
      });

      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.transactions).toEqual([]);
    });

    it('should identify admin users', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { financial_visibility_team: true },
        error: null,
      });

      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.isAdmin).toBe(true);
    });
  });

  describe('React Query Integration', () => {
    it('should use correct query keys for visibility', () => {
      const key = financialKeys.visibility('org-123');

      expect(key).toEqual(['financial', 'visibility', 'org-123']);
    });

    it('should use correct query keys for transactions', () => {
      const key = financialKeys.transactions('org-123');

      expect(key).toEqual(['financial', 'transactions', 'org-123']);
    });
  });
});
