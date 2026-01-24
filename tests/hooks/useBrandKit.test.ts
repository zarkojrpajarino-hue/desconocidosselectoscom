import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBrandKit, brandKitKeys } from '@/hooks/useBrandKit';
import { createWrapper } from '../test-utils';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentOrganizationId: 'org-123',
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useBrandKit Hook', () => {
  describe('Fetching', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useBrandKit(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBeDefined();
    });

    it('should provide expected properties', async () => {
      const { result } = renderHook(() => useBrandKit(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('brandKit');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('createBrandKit');
      expect(result.current).toHaveProperty('updateBrandKit');
      expect(result.current).toHaveProperty('deleteBrandKit');
    });

    it('should return null brand kit when none exists', async () => {
      const { result } = renderHook(() => useBrandKit(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.brandKit).toBeNull();
    });
  });

  describe('React Query Integration', () => {
    it('should use correct query key structure', () => {
      const key = brandKitKeys.brandKit('org-123');

      expect(key).toEqual([
        'brandKits',
        'brandKit',
        { organizationId: 'org-123' },
      ]);
    });
  });
});
