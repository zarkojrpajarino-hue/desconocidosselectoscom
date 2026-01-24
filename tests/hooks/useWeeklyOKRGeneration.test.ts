import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWeeklyOKRGeneration, weeklyOKRKeys } from '@/hooks/useWeeklyOKRGeneration';
import { createWrapper } from '../test-utils';

// Mock Supabase with proper chain structure
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockIlike = vi.fn();
const mockIn = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useWeeklyOKRGeneration Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default auth mock
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      currentOrganizationId: 'org-123',
    });

    // Setup chain methods to return themselves for chaining
    mockSelect.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      ilike: mockIlike,
      in: mockIn,
      order: mockOrder,
    });

    mockEq.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
      ilike: mockIlike,
      order: mockOrder,
    });

    mockIlike.mockReturnValue({
      data: [],
      count: 0,
      error: null,
    });

    mockIn.mockReturnValue({
      data: [],
      error: null,
    });

    mockOrder.mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  });

  describe('Initialization', () => {
    it('should return default state when user is null', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        currentOrganizationId: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      // When disabled, should return default values immediately
      expect(result.current.loading).toBe(false);
      expect(result.current.canGenerate).toBe(false);
      expect(result.current.hasGeneratedThisWeek).toBe(false);
    });
  });

  describe('Weekly OKR Status - Free Plan', () => {
    it('should allow generation when no OKRs generated this week', async () => {
      // Setup mocks for this specific test
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: system_config
          return Promise.resolve({
            data: { week_start: '2026-01-20' },
            error: null,
          });
        } else if (callCount === 2) {
          // Second call: organizations
          return Promise.resolve({
            data: { plan: 'free' },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mock objectives count and data queries
      let ilikeCallCount = 0;
      mockIlike.mockImplementation(() => {
        ilikeCallCount++;
        if (ilikeCallCount === 1) {
          // First ilike: count query
          return Promise.resolve({
            count: 0,
            error: null,
          });
        } else {
          // Second ilike: data query
          return Promise.resolve({
            data: [],
            error: null,
          });
        }
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.hasGeneratedThisWeek).toBe(false);
      expect(result.current.canGenerate).toBe(true);
      expect(result.current.generationCount).toBe(0);
      expect(result.current.plan).toBe('free');
    });

    it('should NOT allow generation when already generated this week', async () => {
      // Setup mocks for this specific test
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: { week_start: '2026-01-20' },
            error: null,
          });
        } else if (callCount === 2) {
          return Promise.resolve({
            data: { plan: 'free' },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mock objectives count and data queries
      let ilikeCallCount = 0;
      mockIlike.mockImplementation(() => {
        ilikeCallCount++;
        if (ilikeCallCount === 1) {
          // Count query - 1 generation this week
          return Promise.resolve({
            count: 1,
            error: null,
          });
        } else {
          // Data query - one active OKR
          return Promise.resolve({
            data: [{ id: '1', status: 'active' }],
            error: null,
          });
        }
      });

      // Mock key results query
      mockIn.mockResolvedValue({
        data: [{ id: 'kr-1', current_value: 50, target_value: 100 }],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.hasGeneratedThisWeek).toBe(true);
      expect(result.current.canGenerate).toBe(false);
      expect(result.current.generationCount).toBe(1);
    });
  });

  describe('Weekly OKR Status - Enterprise Plan', () => {
    it('should allow multiple generations when all OKRs completed', async () => {
      // Setup mocks for this specific test
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: { week_start: '2026-01-20' },
            error: null,
          });
        } else if (callCount === 2) {
          return Promise.resolve({
            data: { plan: 'enterprise' },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mock objectives count and data queries
      let ilikeCallCount = 0;
      mockIlike.mockImplementation(() => {
        ilikeCallCount++;
        if (ilikeCallCount === 1) {
          // Count query - 2 generations
          return Promise.resolve({
            count: 2,
            error: null,
          });
        } else {
          // Data query - all completed
          return Promise.resolve({
            data: [
              { id: '1', status: 'completed' },
              { id: '2', status: 'completed' },
            ],
            error: null,
          });
        }
      });

      // All KRs completed
      mockIn.mockResolvedValue({
        data: [
          { id: 'kr-1', current_value: 100, target_value: 100 },
          { id: 'kr-2', current_value: 150, target_value: 100 },
        ],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.plan).toBe('enterprise');
      expect(result.current.hasGeneratedThisWeek).toBe(true);
      expect(result.current.allOKRsCompleted).toBe(true);
      expect(result.current.canRegenerateEnterprise).toBe(true);
      expect(result.current.canGenerate).toBe(true); // Can regenerate
    });

    it('should NOT allow regeneration when OKRs incomplete', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { week_start: '2026-01-20' },
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { plan: 'enterprise' },
        error: null,
      });

      mockIlike.mockResolvedValueOnce({
        count: 1,
        error: null,
      });

      // Some OKRs incomplete
      mockIlike.mockResolvedValueOnce({
        data: [{ id: '1', status: 'active' }],
        error: null,
      });

      mockIn.mockResolvedValueOnce({
        data: [{ id: 'kr-1', current_value: 50, target_value: 100 }],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.allOKRsCompleted).toBe(false);
      expect(result.current.canRegenerateEnterprise).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should return correct blocked message for free plan', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { week_start: '2026-01-20' },
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { plan: 'free' },
        error: null,
      });

      mockIlike.mockResolvedValueOnce({ count: 1, error: null });
      mockIlike.mockResolvedValueOnce({
        data: [{ id: '1', status: 'active' }],
        error: null,
      });
      mockIn.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      const message = result.current.getBlockedMessage();
      expect(message).toContain('próxima semana');
    });

    it('should return empty string when can generate', async () => {
      // Setup mocks for this specific test
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: { week_start: '2026-01-20' },
            error: null,
          });
        } else if (callCount === 2) {
          return Promise.resolve({
            data: { plan: 'free' },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mock objectives count and data queries
      let ilikeCallCount = 0;
      mockIlike.mockImplementation(() => {
        ilikeCallCount++;
        if (ilikeCallCount === 1) {
          return Promise.resolve({ count: 0, error: null });
        } else {
          return Promise.resolve({ data: [], error: null });
        }
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      const message = result.current.getBlockedMessage();
      expect(message).toBe('');
    });
  });

  describe('React Query Integration', () => {
    it('should use correct query key structure', () => {
      const key = weeklyOKRKeys.status('user-123', 'org-123');

      expect(key).toEqual([
        'weeklyOKRGeneration',
        'status',
        { userId: 'user-123', organizationId: 'org-123' },
      ]);
    });

    it('should provide refetch function', async () => {
      mockSingle.mockResolvedValue({ data: { week_start: '2026-01-20' }, error: null });
      mockSingle.mockResolvedValue({ data: { plan: 'free' }, error: null });
      mockIlike.mockResolvedValue({ count: 0, error: null });
      mockIlike.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.refreshStatus).toBeDefined();
      expect(typeof result.current.refreshStatus).toBe('function');
    });
  });
});
