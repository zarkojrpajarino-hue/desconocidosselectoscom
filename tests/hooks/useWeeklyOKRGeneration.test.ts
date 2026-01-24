import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWeeklyOKRGeneration } from '@/hooks/useWeeklyOKRGeneration';
import { createWrapper } from '../test-utils';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: mockSelect,
    })),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123' },
    organization: { id: 'org-123', plan: 'free' },
  })),
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
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockGte.mockReturnThis();
    mockSingle.mockReturnThis();
  });

  describe('Initialization', () => {
    it('should return default state when userId is null', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        organization: null,
      } as any);

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual({
        hasGeneratedThisWeek: false,
        allOKRsCompleted: false,
        canGenerate: false,
        canRegenerateEnterprise: false,
        currentWeekStart: '',
        generationCount: 0,
        plan: 'free',
      });
    });

    it('should return default state when organizationId is null', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-123' },
        organization: null,
      } as any);

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.canGenerate).toBe(false);
    });
  });

  describe('Weekly OKR Status - Free Plan', () => {
    it('should allow generation when no OKRs generated this week (free plan)', async () => {
      const mockWeekStart = '2026-01-20';

      // Mock system_config
      mockSingle.mockResolvedValueOnce({
        data: { week_start: mockWeekStart },
        error: null,
      });

      // Mock organizations (free plan)
      mockSingle.mockResolvedValueOnce({
        data: { plan: 'free' },
        error: null,
      });

      // Mock objectives count (0 this week)
      mockEq.mockResolvedValueOnce({
        count: 0,
        error: null,
      });

      // Mock all objectives for completion check
      mockEq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        hasGeneratedThisWeek: false,
        canGenerate: true,
        generationCount: 0,
        plan: 'free',
        currentWeekStart: mockWeekStart,
      });
    });

    it('should NOT allow generation when already generated this week (free plan)', async () => {
      const mockWeekStart = '2026-01-20';

      mockSingle.mockResolvedValueOnce({
        data: { week_start: mockWeekStart },
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { plan: 'free' },
        error: null,
      });

      // 1 generation this week
      mockEq.mockResolvedValueOnce({
        count: 1,
        error: null,
      });

      mockEq.mockResolvedValueOnce({
        data: [{ id: '1', progress: 50 }],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        hasGeneratedThisWeek: true,
        canGenerate: false,
        generationCount: 1,
        plan: 'free',
      });
    });
  });

  describe('Weekly OKR Status - Enterprise Plan', () => {
    it('should allow multiple generations per week (enterprise plan)', async () => {
      const mockWeekStart = '2026-01-20';

      mockSingle.mockResolvedValueOnce({
        data: { week_start: mockWeekStart },
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { plan: 'enterprise' },
        error: null,
      });

      // 3 generations this week
      mockEq.mockResolvedValueOnce({
        count: 3,
        error: null,
      });

      mockEq.mockResolvedValueOnce({
        data: [
          { id: '1', progress: 100 },
          { id: '2', progress: 100 },
          { id: '3', progress: 100 },
        ],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        hasGeneratedThisWeek: true,
        canGenerate: true, // Enterprise can always generate
        canRegenerateEnterprise: true,
        generationCount: 3,
        plan: 'enterprise',
        allOKRsCompleted: true,
      });
    });

    it('should detect all OKRs completed', async () => {
      const mockWeekStart = '2026-01-20';

      mockSingle.mockResolvedValueOnce({
        data: { week_start: mockWeekStart },
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { plan: 'enterprise' },
        error: null,
      });

      mockEq.mockResolvedValueOnce({
        count: 2,
        error: null,
      });

      // All OKRs at 100%
      mockEq.mockResolvedValueOnce({
        data: [
          { id: '1', progress: 100 },
          { id: '2', progress: 100 },
        ],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.allOKRsCompleted).toBe(true);
    });

    it('should detect incomplete OKRs', async () => {
      const mockWeekStart = '2026-01-20';

      mockSingle.mockResolvedValueOnce({
        data: { week_start: mockWeekStart },
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { plan: 'enterprise' },
        error: null,
      });

      mockEq.mockResolvedValueOnce({
        count: 2,
        error: null,
      });

      // Some OKRs incomplete
      mockEq.mockResolvedValueOnce({
        data: [
          { id: '1', progress: 100 },
          { id: '2', progress: 50 }, // Incomplete
        ],
        error: null,
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.allOKRsCompleted).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('React Query Integration', () => {
    it('should use correct query key structure', async () => {
      const { weeklyOKRKeys } = await import('@/hooks/useWeeklyOKRGeneration');

      const key = weeklyOKRKeys.status('user-123', 'org-123');

      expect(key).toEqual([
        'weeklyOKRGeneration',
        'status',
        { userId: 'user-123', organizationId: 'org-123' },
      ]);
    });

    it('should be disabled when userId is null', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        organization: null,
      } as any);

      const { result } = renderHook(() => useWeeklyOKRGeneration(), {
        wrapper: createWrapper(),
      });

      // Should return default state immediately without loading
      expect(result.current.loading).toBe(false);
    });
  });
});
