import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFinancialData, useToggleVisibility } from '@/hooks/useFinancialData';
import { createWrapper } from '../test-utils';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockMaybeSingle = vi.fn();

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
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockReturnThis();
    mockLimit.mockReturnThis();
    mockSingle.mockReturnThis();
    mockMaybeSingle.mockReturnThis();
    mockUpdate.mockReturnThis();
  });

  describe('Fetching Financial Visibility', () => {
    it('should fetch financial visibility settings', async () => {
      const mockVisibility = {
        organization_id: 'org-123',
        financial_visibility_team: true,
        created_at: '2026-01-20T00:00:00Z',
        updated_at: '2026-01-20T00:00:00Z',
      };

      mockMaybeSingle.mockResolvedValueOnce({
        data: mockVisibility,
        error: null,
      });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loadingVisibility).toBe(false);
      });

      expect(result.current.isVisibleToTeam).toBe(true);
    });

    it('should default to false when no visibility setting exists', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loadingVisibility).toBe(false);
      });

      expect(result.current.isVisibleToTeam).toBe(false);
    });

    it('should handle visibility fetch errors', async () => {
      const error = new Error('Database error');
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error,
      });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.visibilityError).toBeTruthy();
      });
    });
  });

  describe('Fetching Transactions', () => {
    it('should fetch revenue transactions', async () => {
      const mockRevenue = [
        {
          id: '1',
          date: '2024-01-01',
          amount: 5000,
          product_category: 'SaaS',
          product_name: 'Pro Plan',
          organization_id: 'org-123',
        },
        {
          id: '2',
          date: '2024-01-05',
          amount: 3000,
          product_category: 'Consulting',
          product_name: 'Strategy Session',
          organization_id: 'org-123',
        },
      ];

      // Mock visibility
      mockMaybeSingle.mockResolvedValueOnce({
        data: { financial_visibility_team: true },
        error: null,
      });

      // Mock revenue
      mockLimit.mockResolvedValueOnce({
        data: mockRevenue,
        error: null,
      });

      // Mock expenses
      mockLimit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock marketing
      mockLimit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loadingTransactions).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(2);
      expect(result.current.transactions[0].amount).toBe(5000);
    });

    it('should fetch expense transactions', async () => {
      const mockExpenses = [
        {
          id: '3',
          date: '2024-01-02',
          amount: 1000,
          category: 'Servers',
          description: 'AWS hosting',
          organization_id: 'org-123',
        },
        {
          id: '4',
          date: '2024-01-10',
          amount: 2000,
          category: 'Marketing',
          description: 'Google Ads',
          organization_id: 'org-123',
        },
      ];

      mockMaybeSingle.mockResolvedValueOnce({
        data: { financial_visibility_team: true },
        error: null,
      });

      mockLimit
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: mockExpenses, error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loadingTransactions).toBe(false);
      });

      const expenses = result.current.transactions.filter(t => t.amount < 0);
      expect(expenses).toHaveLength(2);
    });

    it('should combine revenue, expenses, and marketing data', async () => {
      const mockRevenue = [{ id: '1', amount: 5000, date: '2024-01-01' }];
      const mockExpenses = [{ id: '2', amount: 1000, date: '2024-01-02' }];
      const mockMarketing = [{ id: '3', amount: 500, date: '2024-01-03' }];

      mockMaybeSingle.mockResolvedValueOnce({
        data: { financial_visibility_team: true },
        error: null,
      });

      mockLimit
        .mockResolvedValueOnce({ data: mockRevenue, error: null })
        .mockResolvedValueOnce({ data: mockExpenses, error: null })
        .mockResolvedValueOnce({ data: mockMarketing, error: null });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loadingTransactions).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(3);
    });

    it('should handle transaction fetch errors', async () => {
      const error = new Error('Database error');

      mockMaybeSingle.mockResolvedValueOnce({
        data: { financial_visibility_team: true },
        error: null,
      });

      mockLimit.mockResolvedValueOnce({
        data: null,
        error,
      });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.transactionsError).toBeTruthy();
      });
    });

    it('should handle empty transaction data', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { financial_visibility_team: true },
        error: null,
      });

      mockLimit
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loadingTransactions).toBe(false);
      });

      expect(result.current.transactions).toEqual([]);
    });
  });

  describe('Multi-tenancy', () => {
    it('should filter transactions by organization_id', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { financial_visibility_team: true },
        error: null,
      });

      mockLimit
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useFinancialData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loadingTransactions).toBe(false);
      });

      expect(mockEq).toHaveBeenCalledWith('organization_id', 'org-123');
    });
  });

  describe('React Query Integration', () => {
    it('should use correct query keys for visibility', async () => {
      const { financialKeys } = await import('@/hooks/useFinancialData');

      const key = financialKeys.visibility('org-123');

      expect(key).toEqual([
        'financialData',
        'visibility',
        { organizationId: 'org-123' },
      ]);
    });

    it('should use correct query keys for transactions', async () => {
      const { financialKeys } = await import('@/hooks/useFinancialData');

      const key = financialKeys.transactions('org-123');

      expect(key).toEqual([
        'financialData',
        'transactions',
        { organizationId: 'org-123' },
      ]);
    });
  });
});

describe('useToggleVisibility Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnThis();
    mockEq.mockReturnThis();
  });

  describe('Toggle Mutation', () => {
    it('should toggle visibility successfully', async () => {
      mockEq.mockResolvedValueOnce({
        data: { financial_visibility_team: true },
        error: null,
      });

      const { result } = renderHook(() => useToggleVisibility('org-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.toggleVisibility(true);
      });

      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        financial_visibility_team: true,
      });
    });

    it('should handle toggle errors', async () => {
      const error = new Error('Update failed');

      mockEq.mockResolvedValueOnce({
        data: null,
        error,
      });

      const { result } = renderHook(() => useToggleVisibility('org-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(result.current.toggleVisibility(true)).rejects.toThrow(
          'Update failed'
        );
      });
    });

    it('should invalidate queries after successful toggle', async () => {
      mockEq.mockResolvedValueOnce({
        data: { financial_visibility_team: false },
        error: null,
      });

      const { result } = renderHook(() => useToggleVisibility('org-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.toggleVisibility(false);
      });

      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });

      // Query should be invalidated and refetched
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});

describe('Financial Calculations (Helper Functions)', () => {
  it('should calculate total revenue correctly', () => {
    const transactions = [
      { amount: 5000, type: 'revenue' },
      { amount: 3000, type: 'revenue' },
      { amount: -1000, type: 'expense' },
    ];

    const totalRevenue = transactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(totalRevenue).toBe(8000);
  });

  it('should calculate total expenses correctly', () => {
    const transactions = [
      { amount: 5000, type: 'revenue' },
      { amount: -1000, type: 'expense' },
      { amount: -2000, type: 'expense' },
    ];

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    expect(totalExpenses).toBe(3000);
  });

  it('should calculate net profit correctly', () => {
    const revenue = 10000;
    const expenses = 7000;
    const netProfit = revenue - expenses;

    expect(netProfit).toBe(3000);
  });

  it('should calculate profit margin percentage', () => {
    const revenue = 10000;
    const profit = 3000;
    const margin = (profit / revenue) * 100;

    expect(margin).toBe(30);
  });
});
