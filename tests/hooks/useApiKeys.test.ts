import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiKeys } from '@/hooks/integrations/useApiKeys';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                id: '1',
                name: 'Test API Key',
                key_prefix: 'sk_live_',
                is_active: true,
                scopes: ['read', 'write'],
                rate_limit: 100,
                last_used_at: null,
                created_at: '2025-01-01T00:00:00Z',
                expires_at: null,
              }
            ],
            error: null
          }))
        }))
      }))
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Mock Auth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

describe('useApiKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state', () => {
    const { result } = renderHook(() => useApiKeys('org-123'));
    expect(result.current.loading).toBe(true);
  });

  it('should load API keys successfully', async () => {
    const { result } = renderHook(() => useApiKeys('org-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apiKeys).toHaveLength(1);
    expect(result.current.apiKeys[0].name).toBe('Test API Key');
    expect(result.current.apiKeys[0].key_prefix).toBe('sk_live_');
  });

  it('should not load without organizationId', async () => {
    const { result } = renderHook(() => useApiKeys(null));
    
    // Should remain in loading but not fetch
    expect(result.current.apiKeys).toEqual([]);
  });

  it('should have create and delete functions', () => {
    const { result } = renderHook(() => useApiKeys('org-123'));

    expect(typeof result.current.createApiKey).toBe('function');
    expect(typeof result.current.deleteApiKey).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should handle new key display state', () => {
    const { result } = renderHook(() => useApiKeys('org-123'));

    expect(result.current.newKey).toBeNull();
    expect(result.current.showNewKey).toBe(false);
    expect(typeof result.current.dismissNewKey).toBe('function');
  });
});
